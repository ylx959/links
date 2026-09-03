import gsap from 'gsap'
import { CustomBounce } from 'gsap/CustomBounce'
import { CustomEase } from 'gsap/CustomEase'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { createWordPhysics } from './wordPhysics'

gsap.registerPlugin(CustomEase, CustomBounce, DrawSVGPlugin, ScrollTrigger, SplitText)

/**
 * About 那一屏，捲到就自己演完：
 *
 *   落款一筆一筆寫完 → 收了筆，第一段才在原地淡進來
 *   → 停一下讓人讀完 → 整段以「單字」為單位掉下去，一路撞到畫面底部堆起來
 *   → 下一段在原位淡進來
 *   → 最後一段留在畫面上，前面三段的字都還躺在底下
 *
 * 進場是整段一起浮出來，退場才拆成單字：句子是一次讀進眼裡的東西，一個字母一個字母
 * 送上來只會讓人等；但掉下去的是有意義的顆粒 —— 一個個單字看得懂，拆成字母就只是
 * 一地碎墨。
 *
 * 掉下去那一段交給 matter-js（見 wordPhysics）。四段共用同一個世界，所以後面掉下來的
 * 字是真的疊在前面那堆上，而不是各自算好落點再假裝疊在一起。
 *
 * 完全捲離視線就歸零，再捲回來從頭演一次。
 */

/** 筆速：每秒走完落款總寬度的幾成。用比例而不是 px／秒，換掉 SVG 檔也不用回來改。 */
const PEN_SPEED = 0.78
const STROKE_MIN = 0.16
const STROKE_MAX = 0.8
/** 下一筆提前多少起跑。筆尖在空中的那一下是連著的，完全不重疊會變成打字機。 */
const PEN_LIFT = '>-=0.06'

/** 一段話浮出來要多久。慢到看得出是「浮」，短到不必等它。 */
const FADE_IN = 0.9
/**
 * 收筆到第一段浮出來之間的空拍。
 *
 * 這一拍是刻意的：落款要先寫完、被看見，敘述才接話 —— 兩件事重疊的話，眼睛會分不清
 * 該看哪一邊，手寫的那一下就白寫了。留一點空，讓筆先落地。
 */
const FADE_GAP = 0.4

/**
 * 浮完到開始掉，中間留的閱讀時間。
 *
 * 整段是一次出現的，所以這裡得給完整的閱讀時間 —— 不像逐字送上來時，字是邊出現邊被
 * 讀掉的，只需要補尾巴那一小段落差。每字的係數就是照著「一句話大概讀多久」抓的。
 */
const HOLD_BASE = 1
const HOLD_PER_CHAR = 0.02

/** 字最後停在離區塊底緣多遠的地方 —— 也就是物理世界的地板。 */
const FLOOR_INSET = 40

/**
 * 落地後的不透明度。
 *
 * 講過的話是沉在底下的沉積物，不是還要人讀的內容 —— 留著全黑會跟正在讀的那一段
 * 搶注意力。淡下來之後它就只剩質地，該讀的還是上面那一段。
 */
const SETTLED = 0.26
const SETTLE_FADE = 0.9

/**
 * 從放手到下一段開始浮，中間留多久。
 *
 * 補間版本的長度是自己算出來的，物理版本沒有「長度」可問 —— 引擎只是一直跑。
 * 所以這裡改成明著留一段空窗，長度取「掉下去 + 彈兩下 + 安靜下來」的實測值。
 */
const FALL_WINDOW = 1.9

/** 區塊頂端過了視窗這個高度才開演。留一段，讓人「捲到了」而不是「捲過頭才發現」。 */
const START = 'top 68%'
/**
 * 歸零的界線：落款本身掉出視窗下緣。
 *
 * 不能用「整個 About 離開視線」——第一屏正好是 min-h-dvh，區塊頂端貼在視窗下緣時
 * 捲軸剛好是 0，界線疊在盡頭上，往回捲永遠跨不過去，也就永遠不會重置。改盯落款自己：
 * 它在區塊裡還隔著一段 pt，界線於是落在 0 之後，有路可跨。
 */
const REWIND = 'top bottom'

/**
 * 一段話拆開之後的樣子。
 *
 * 只需要單字這一層顆粒度：進場是整段一起淡入，不必拆；掉落才要一個個單字。
 * 落點不用存 —— 那是物理世界算的，不是我們排的。
 */
type Stage = {
  words: HTMLElement[]
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
  const paragraphs = gsap.utils.toArray<HTMLElement>(section.querySelectorAll('[data-para]'))
  if (!frame || !signature || !stage || !paragraphs.length) return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const strokes = gsap.utils.toArray<SVGPathElement>(signature.querySelectorAll('path'))
    // 落款自己座標系的寬度。筆速換算成秒數要除以它，換掉 SVG 檔也不用回來改常數。
    const spanX = signature.viewBox.baseVal.width || signature.getBBox().width

    const physics = createWordPhysics(stage)
    const stages: Stage[] = paragraphs.map(() => ({ words: [] }))
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

      // 物理世界的地板與左右牆，換算到 stage 的座標系。
      physics.setBounds(
        box.left + parseFloat(pad.paddingLeft) - origin.left,
        box.right - parseFloat(pad.paddingRight) - origin.left,
        box.bottom - FLOOR_INSET - origin.top,
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
      gsap.set(strokes, { drawSVG: '0%' })
      gsap.set(
        stages.flatMap((s) => s.words),
        { x: 0, y: 0, rotation: 0, opacity: 1 },
      )
      gsap.set(paragraphs, { autoAlpha: 0 })
    }

    const buildMaster = () => {
      const tl = gsap.timeline({ paused: true })

      // 一筆接一筆排上去，而不是交給 stagger：stagger 的間隔是固定的，
      // 但每筆長度不一樣，短筆會空等、長筆會互相撞。這裡是「上一筆寫完就接下一筆」。
      strokes.forEach((path, i) => {
        tl.fromTo(
          path,
          { drawSVG: '0%' },
          {
            drawSVG: '100%',
            duration: gsap.utils.clamp(
              STROKE_MIN,
              STROKE_MAX,
              path.getTotalLength() / spanX / PEN_SPEED,
            ),
            // 起筆收筆慢、中段快 —— 真的手在走的速度曲線。
            ease: 'power1.inOut',
            immediateRender: false,
          },
          i === 0 ? 0 : PEN_LIFT,
        )
      })

      stages.forEach((s, i) => {
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
          { autoAlpha: 1, duration: FADE_IN, ease: 'power2.out', immediateRender: false },
          fadeAt,
        )

        // 最後一段是結語，它不掉 —— 留在畫面上，底下躺著前面說過的每一個字。
        if (i === stages.length - 1) return

        const fallAt = fadeAt + FADE_IN + HOLD_BASE + HOLD_PER_CHAR * length

        // 放手。之後這一段的字就不歸時間軸管了 —— 它們掉多久、彈幾下、停在誰身上，
        // 是引擎跟地板之間的事。時間軸只負責留一段空窗等它們落定。
        tl.call(() => physics.drop(s.words), undefined, fallAt)
        tl.to(s.words, { opacity: SETTLED, duration: SETTLE_FADE, ease: 'none' }, fallAt)
        tl.to({}, { duration: FALL_WINDOW }, fallAt)
      })

      return tl
    }

    /** 切完行（或重切）之後把量測與時間軸重新對上。 */
    const rebuild = () => {
      master?.kill()
      measure()
      master = buildMaster()
      // 重切多半發生在轉螢幕或縮視窗。已經演完就直接補到結局，不要當著人面重播一次。
      // 補間可以 progress(1) 一步到位，物理不行 —— 它只會往前跑。所以讓引擎空跑到
      // 落定為止，兩邊才會停在同一個結局。
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
          stages[i].words = self.words as HTMLElement[]
          // 四段各自切各自的，但時間軸是一條。等最後一段也切好了再一起重建，
          // 否則前三次重建拿到的都是還沒切完的殘缺狀態。
          if (stages.every((s) => s.words.length)) rebuild()
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
