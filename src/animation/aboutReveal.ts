import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { createWordPhysics } from './wordPhysics'

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger, SplitText)

/** About 動畫：寫標題、逐段顯示與掉字、擦除標題，最後畫出並浮動簽名。 */

/** 每秒畫完 SVG 寬度的比例。 */
const PEN_SPEED = 0.6
const STROKE_MIN = 0.16
const STROKE_MAX = 0.8
/** 下一筆在前一筆完成前多久開始。 */
const PEN_LIFT = '>-=0.06'

/** 擦除順序與書寫相反，筆畫由收筆處縮回起筆處。 */
const ERASE_LIFT = '>-=0.12'
const ERASE_GAP = 0.35
const SIGNOFF_GAP = 0.7

/** 段落淡入時間；power1.out 避免過早接近全不透明。 */
const FADE_IN = 1.8
/** 標題收筆到首段顯示之間的停頓。 */
const FADE_GAP = 0.4

/** 淡入後的閱讀時間，由基本值加上字數調整。 */
const HOLD_BASE = 0.8
const HOLD_PER_CHAR = 0.01

/** 超過區塊底緣後的移除距離，替旋轉文字保留高度。 */
const CULL_BELOW = 120

/** 投放到下一段淡入的時間窗，用來銜接無法查詢完成時間的物理引擎。 */
const FALL_WINDOW = 1

/** Hover 縮放套在外層，與 SVG 本身的呼吸動畫互不覆蓋。 */
const HOVER_SCALE = 1.02
const HOVER_TIME = 0.45

const FLOAT_SHIFT = 7
const FLOAT_TIME = 3.4
const BREATH_SCALE = 1.018
const BREATH_TIME = 4.2

const START = 'top 68%'
/** 標題離開視窗下緣時歸零，確保頁首保有足夠捲動距離。 */
const REWIND = 'top bottom'

/** 依筆畫長度和 SVG 寬度計算時間。 */
const strokeDuration = (path: SVGPathElement, spanX: number, speed: number) =>
  gsap.utils.clamp(STROKE_MIN, STROKE_MAX, path.getTotalLength() / spanX / speed)

const write = (
  tl: gsap.core.Timeline,
  paths: SVGPathElement[],
  spanX: number,
  at: number,
) => {
  paths.forEach((path, i) => {
    tl.fromTo(
      path,
      { drawSVG: '0%' },
      {
        drawSVG: '100%',
        duration: strokeDuration(path, spanX, PEN_SPEED),
        ease: 'power1.inOut',
        immediateRender: false,
      },
      i === 0 ? at : PEN_LIFT,
    )
  })
}

/** 反向擦除筆畫，讓可見線段從收筆處縮回起筆處。 */
const erase = (
  tl: gsap.core.Timeline,
  paths: SVGPathElement[],
  spanX: number,
  at: number,
) => {
  const reversedPaths = [...paths].reverse()
  reversedPaths.forEach((path, i) => {
    tl.fromTo(
      path,
      { drawSVG: '0% 100%' },
      {
        drawSVG: '0% 0%',
        duration: strokeDuration(path, spanX, PEN_SPEED),
        ease: 'power1.inOut',
        immediateRender: false,
      },
      i === 0 ? at : ERASE_LIFT,
    )
  })
}

/** 簽名完成後循環浮動與呼吸；起點由 snapToStart 統一重設。 */
const createFloat = (target: SVGSVGElement) =>
  gsap
    .timeline({ paused: true, repeat: -1, yoyo: true })
    .to(target, { y: -FLOAT_SHIFT, duration: FLOAT_TIME, ease: 'sine.inOut' }, 0)
    .to(
      target,
      {
        scale: BREATH_SCALE,
        transformOrigin: '50% 50%',
        duration: BREATH_TIME,
        ease: 'sine.inOut',
      },
      0,
    )

/** 在 useGSAP 中執行，並自行清除 SplitText 節點與 ScrollTrigger。 */
export function playAboutReveal(section: HTMLElement | null): (() => void) | undefined {
  if (!section) return

  const frame = section.querySelector<HTMLElement>('[data-signature]')
  const signature = frame?.querySelector('svg') ?? null
  const stage = section.querySelector<HTMLElement>('[data-stage]')
  const hit = section.querySelector<HTMLElement>('[data-signoff-hit]')
  const signOff = hit?.querySelector('svg') ?? null
  const paragraphs = gsap.utils.toArray<HTMLElement>(section.querySelectorAll('[data-para]'))
  if (!frame || !signature || !stage || !hit || !signOff || !paragraphs.length) return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const strokes = gsap.utils.toArray<SVGPathElement>(signature.querySelectorAll('path'))
    const signOffStrokes = gsap.utils.toArray<SVGPathElement>(signOff.querySelectorAll('path'))
    // 每個 SVG 自己座標系的寬度。筆速換算成秒數要除以它，換掉檔案也不用回來改常數。
    const spanX = signature.viewBox.baseVal.width || signature.getBBox().width
    const signOffSpanX = signOff.viewBox.baseVal.width || signOff.getBBox().width

    const physics = createWordPhysics(stage)
    const float = createFloat(signOff)

    const enter = () =>
      gsap.to(hit, { scale: HOVER_SCALE, duration: HOVER_TIME, ease: 'power2.out', overwrite: 'auto' })
    const leave = () =>
      gsap.to(hit, { scale: 1, duration: HOVER_TIME, ease: 'power2.out', overwrite: 'auto' })
    hit.addEventListener('pointerenter', enter)
    hit.addEventListener('pointerleave', leave)

    /** 簽完名才讓它可以被摸到；歸零時收回去，順便把 hover 放大也擦掉。 */
    const arm = (on: boolean) => {
      if (on) {
        gsap.set(hit, { pointerEvents: 'auto' })
        return
      }
      // 可能正好停在放大到一半 —— 先把補間收掉，再把尺寸擺回去。
      gsap.killTweensOf(hit)
      gsap.set(hit, { pointerEvents: 'none', scale: 1 })
    }

    const wordGroups: HTMLElement[][] = paragraphs.map(() => [])
    let master: gsap.core.Timeline | null = null
    /** 這一刻「應該」是演完的狀態嗎。重切行之後要靠它決定補到頭還是補到尾。 */
    let revealed = false

    /** 切字後量測物理邊界並固定 stage 高度，避免掉字造成版面跳動。 */
    const measure = () => {
      const origin = stage.getBoundingClientRect()
      const box = section.getBoundingClientRect()
      const pad = getComputedStyle(section)

      // 左右牆與「掉出去」的界線，換算到 stage 的座標系。
      physics.setBounds(
        box.left + parseFloat(pad.paddingLeft) - origin.left,
        box.right - parseFloat(pad.paddingRight) - origin.left,
        box.bottom + CULL_BELOW - origin.top,
      )

      // 固定最高段落的高度，避免文字脫離文件流後整組上跳。
      stage.style.minHeight = `${origin.height}px`
    }

    /** 直接還原開場狀態；倒帶不會重設尚未渲染的 fromTo 目標。 */
    const snapToStart = () => {
      // 先把字從物理世界撈回來 —— 它們身上的 position/left/top 是引擎寫的，
      // GSAP 不知道有這回事，不撤掉的話下面設多少 x/y 都沒有用。
      physics.reset()
      // 浮動是無限迴圈，不會自己結束 —— 先停手，再把它寫在簽名上的 transform 抹掉。
      // 不能用 pause(0)：那會把時間軸渲染到 progress 0，等於又把起始值寫回去一次。
      float.pause()
      arm(false)
      gsap.set(signOff, { y: 0, scale: 1, transformOrigin: '50% 50%' })
      gsap.set([...strokes, ...signOffStrokes], { drawSVG: '0%' })
      gsap.set(
        wordGroups.flat(),
        { x: 0, y: 0, rotation: 0, opacity: 1 },
      )
      gsap.set(paragraphs, { autoAlpha: 0 })
      // 字都回到版面上了，而且到放手為止都不會再動 —— 趁這個空檔把下一輪要掉的
      // body 全部量好建好。放手那一幀就不必再讀 DOM，也就沒有那次強制回流。
      physics.prime(wordGroups.flat())
    }

    const buildMaster = () => {
      // 最後一筆收了，簽名才開始浮 —— 寫字的過程本身不該晃。
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          float.restart()
          arm(true)
        },
      })

      write(tl, strokes, spanX, 0)

      wordGroups.forEach((words, i) => {
        const length = paragraphs[i].textContent?.length ?? 0
        // 首段接在標題後，其餘段落接在前段掉落窗口後。
        const fadeAt = tl.duration() + (i === 0 ? FADE_GAP : 0)

        // 淡入整個段落，避免個別單字產生閃爍。
        tl.fromTo(
          paragraphs[i],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: FADE_IN, ease: 'power1.out', immediateRender: false },
          fadeAt,
        )

        const fallAt = fadeAt + FADE_IN + HOLD_BASE + HOLD_PER_CHAR * length

        // 放手。之後這一段的字就不歸時間軸管了 —— 怎麼轉、怎麼擦過牆、什麼時候
        // 掉出畫面，是引擎的事。時間軸只負責留一段空窗等它們走完。
        tl.call(() => physics.drop(words), undefined, fallAt)
        tl.to({}, { duration: FALL_WINDOW }, fallAt)
      })

      // 話講完了，連題目都收掉：字掉光之後把「About me.」倒著擦回去，
      // 空一拍，再在視窗正中央簽下名字。整屏於是從一句話收束成一個記號。
      erase(tl, strokes, spanX, tl.duration() + ERASE_GAP)
      write(tl, signOffStrokes, signOffSpanX, tl.duration() + SIGNOFF_GAP)

      return tl
    }

    /** 切完行（或重切）之後把量測與時間軸重新對上。 */
    const rebuild = () => {
      master?.kill()
      measure()
      master = buildMaster()
      // 重切時若已播完，補間跳到結尾並讓物理引擎快轉至相同狀態。
      if (revealed) {
        master.progress(1)
        physics.settle()
        // progress() 是 seek，不會觸發 onComplete，所以浮動與 hover 要自己補上。
        float.restart()
        arm(true)
      } else snapToStart()
    }

    // autoSplit 依版面重切；onSplit 只更新單字，動畫生命週期仍由捲動控制。
    const splits = paragraphs.map((p, i) =>
      SplitText.create(p, {
        // 只切到單字：掉下去的是單字，斷行也仍然斷在詞之間。
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          // SplitText 的型別是 Element[]，但切出來的一律是 <div>／<span>；
          // 物理那邊要寫 style，所以在這裡收窄一次。
          wordGroups[i] = self.words as HTMLElement[]
          // 四段各自切各自的，但時間軸是一條。等最後一段也切好了再一起重建，
          // 否則前三次重建拿到的都是還沒切完的殘缺狀態。
          if (wordGroups.every((words) => words.length)) rebuild()
        },
      }),
    )

    const play = ScrollTrigger.create({
      trigger: section,
      start: START,
      onEnter: () => {
        revealed = true
        // 往回捲一點點再捲下來是不會經過歸零那條線的，但這裡照樣要重播 ——
        // 所以自己先清一次，不然上一輪的字還在地上，這一輪的又要疊上去。
        snapToStart()
        master?.restart()
      },
    })

    const rewind = ScrollTrigger.create({
      trigger: frame,
      start: REWIND,
      onLeaveBack: () => {
        revealed = false
        // 先停下並倒帶，再自己把起始值寫回去 —— 倒帶只負責讓時間軸回到起點，
        // 不負責清乾淨（見 snapToStart 的說明）。
        master?.pause(0)
        snapToStart()
      },
    })

    return () => {
      master?.kill()
      float.kill()
      hit.removeEventListener('pointerenter', enter)
      hit.removeEventListener('pointerleave', leave)
      gsap.killTweensOf(hit)
      play.kill()
      rewind.kill()
      physics.destroy()
      // 把包出來的 <span> 拆掉，段落還原成單純的文字節點。
      splits.forEach((s) => s.revert())
    }
  })

  return () => mm.revert()
}
