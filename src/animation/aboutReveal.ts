import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { createWordPhysics } from './wordPhysics'

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger, SplitText)

/**
 * About 那一屏，捲到就自己演完：
 *
 *   落款一筆一筆寫完 → 收了筆，第一段才在原地淡進來
 *   → 停一下讓人讀完 → 整段以「單字」為單位掉下去，一路掉出畫面底部
 *   → 下一段在原位淡進來 → 四段都講完、都掉光
 *   → 「About me.」倒著一筆一筆被擦掉
 *   → 空一拍，親筆簽名在視窗正中央畫出來
 *
 * 進場以段落為單位，退場以單字為單位。掉落由 wordPhysics 處理；完全捲離視線後重置。
 */

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

/**
 * 一段話浮出來要多久。
 *
 * power1.out 讓透明度在整段時間內持續變化，避免過早接近全不透明。
 */
const FADE_IN = 1.8
/**
 * 收筆到第一段浮出來之間的空拍。
 *
 * 讓標題寫完後停頓，再顯示第一段。
 */
const FADE_GAP = 0.4

/**
 * 浮完到開始掉，中間留的閱讀時間。
 *
 * 依字數延長每段的閱讀時間。
 */
const HOLD_BASE = 1
const HOLD_PER_CHAR = 0.02

/**
 * 過了區塊底緣再多遠就算掉出去了。
 *
 * 留出旋轉後的字高，避免文字在區塊邊緣消失。
 */
const CULL_BELOW = 120

/**
 * 從放手到下一段開始浮，中間留多久。
 *
 * 物理引擎沒有可供時間軸查詢的完成時間，因此顯式保留掉落窗口。
 */
const FALL_WINDOW = 1

const START = 'top 68%'
/**
 * 歸零的界線：落款本身掉出視窗下緣。
 *
 * 以標題而非整個 min-h-dvh 區塊為觸發點，確保頁首仍有足夠捲動距離跨過界線。
 */
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

/**
 * 倒著擦掉：最後寫的那一筆最先不見，每一筆從收筆處往起筆處縮回去。
 *
 * drawSVG 從 `0% 100%` 收到 `0% 0%`，固定起筆端並倒退可見線段的尾端。
 */
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

/**
 * 必須跑在 `useGSAP()` 裡。回傳的 cleanup 會被它接走 —— SplitText 包出來的
 * `<span>` 和 ScrollTrigger 都不在 context 的自動回收範圍內（前者改的是 DOM，
 * 後者活在 ScrollTrigger 自己的清單上），所以這裡自己收。
 */
export function playAboutReveal(section: HTMLElement | null): (() => void) | undefined {
  if (!section) return

  const frame = section.querySelector<HTMLElement>('[data-signature]')
  const signature = frame?.querySelector('svg') ?? null
  const stage = section.querySelector<HTMLElement>('[data-stage]')
  const signOff = section.querySelector<HTMLElement>('[data-signoff]')?.querySelector('svg') ?? null
  const paragraphs = gsap.utils.toArray<HTMLElement>(section.querySelectorAll('[data-para]'))
  if (!frame || !signature || !stage || !signOff || !paragraphs.length) return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const strokes = gsap.utils.toArray<SVGPathElement>(signature.querySelectorAll('path'))
    const signOffStrokes = gsap.utils.toArray<SVGPathElement>(signOff.querySelectorAll('path'))
    // 每個 SVG 自己座標系的寬度。筆速換算成秒數要除以它，換掉檔案也不用回來改常數。
    const spanX = signature.viewBox.baseVal.width || signature.getBBox().width
    const signOffSpanX = signOff.viewBox.baseVal.width || signOff.getBBox().width

    const physics = createWordPhysics(stage)
    const wordGroups: HTMLElement[][] = paragraphs.map(() => [])
    let master: gsap.core.Timeline | null = null
    /** 這一刻「應該」是演完的狀態嗎。重切行之後要靠它決定補到頭還是補到尾。 */
    let revealed = false

    /**
     * 量物理世界的邊界，並把版面高度釘住。
     *
     * 只在切完行時量這一次就夠 —— 淡入動的是 autoAlpha，而 autoAlpha 走的是
     * visibility，字位一開始就佔好了，整段浮出來版面一格都沒動過。
     *
     * 地板與字都在同一刻量，所以兩者的差是版面上的相對距離，之後怎麼捲都還算數。
     */
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

      // 字掉下去之後會脫離文件流，那一段的 <p> 會塌掉。四段疊在同一個 grid 格子裡，
      // 格子高度取最高的那一段 —— 塌掉的要是正好是最高的那一段，剩下的段落就會整批
      // 往上跳。先把量到的高度釘住，版面就不會因為誰掉下去而動。
      stage.style.minHeight = `${origin.height}px`
    }

    /**
     * 直接擺回開場前的樣子，不經過動畫。
     *
     * 這是唯一算數的歸零手段。曾經以為把時間軸倒回 0 就等於還原起始值 —— 不是：
     * 那些 `immediateRender: false` 的 fromTo 只有真的被渲染到才會寫回起始值，倒帶時
     * 有將近一半的目標根本沒被碰到，掉下去的位移就留在 style 上。當下看不出來（字是
     * 隱形的），下一輪淡入時它們就帶著上一輪的位移和角度浮出來 —— 那就是「亂掉」。
     */
    const snapToStart = () => {
      // 先把字從物理世界撈回來 —— 它們身上的 position/left/top 是引擎寫的，
      // GSAP 不知道有這回事，不撤掉的話下面設多少 x/y 都沒有用。
      physics.reset()
      gsap.set([...strokes, ...signOffStrokes], { drawSVG: '0%' })
      gsap.set(
        wordGroups.flat(),
        { x: 0, y: 0, rotation: 0, opacity: 1 },
      )
      gsap.set(paragraphs, { autoAlpha: 0 })
    }

    const buildMaster = () => {
      const tl = gsap.timeline({ paused: true })

      write(tl, strokes, spanX, 0)

      wordGroups.forEach((words, i) => {
        const length = paragraphs[i].textContent?.length ?? 0
        // 第一段接在落款最後一筆之後（隔一拍），後面的接在前一段掉完之後。
        // 兩種都是「量現在的結尾」——不能寫相對位置，每加一段時間軸就變長，
        // 相對位置量到的會是新的結尾。
        const fadeAt = tl.duration() + (i === 0 ? FADE_GAP : 0)

        // 整段一起浮，位置不動 —— 沒有位移、沒有逐字，就是原地從沒有到有。
        // 目標是 <p> 本身而不是切出來的單字：一段話是一個東西，各自淡入會散成一片
        // 閃爍的碎片。
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
      // 重切多半發生在轉螢幕或縮視窗。已經演完就直接補到結局，不要當著人面重播一次。
      // 補間可以 progress(1) 一步到位，物理不行 —— 它只會往前跑。所以讓引擎空跑到
      // 字都掉出去為止，兩邊才會停在同一個結局。
      if (revealed) {
        master.progress(1)
        physics.settle()
      } else snapToStart()
    }

    // 「一行」是版面算出來的，不是資料裡寫死的。autoSplit 會自己等
    // document.fonts.ready，也會在寬度或字級變動時重切。
    //
    // onSplit 只負責交出新的那批字，不建動畫。之前把時間軸建在這裡是錯的：重切會把
    // 上一輪回傳的動畫 revert 掉，字體一載入完就正好把寫到一半的筆畫砍斷。
    // 動畫的生死要由捲動決定，不能由「行怎麼切」決定。
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
      play.kill()
      rewind.kill()
      physics.destroy()
      // 把包出來的 <span> 拆掉，段落還原成單純的文字節點。
      splits.forEach((s) => s.revert())
    }
  })

  return () => mm.revert()
}
