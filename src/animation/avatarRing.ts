import gsap from 'gsap'

/**
 * 頭貼 hover 時的波動外框。
 *
 * 動的是取景框自己的 `border-radius` — 框本身就是那一圈線（`outline` 會跟著
 * border-radius 走），所以邊界波到哪裡，照片就露到哪裡。框在 hover 時已經從
 * AVATAR_SIZE 張到 AVATAR_HOVER_SIZE，波動等於再多啃掉一點原本被裁掉的邊。
 *
 * 波的「行進感」全靠形狀本身輪替，不靠 `rotation` — 轉的話裡面的照片會跟著轉。
 */

/** 繞一圈的秒數。慢一點才像在浮，不像在抖。 */
const MORPH = 7
/** 形變幅度（半徑的 %）。 */
const AMP = 7
/** hover 進場、滑開收回的時間。收得比進場快 — 滑開就該立刻收，拖著會黏。 */
const ENTER = 0.9
const SETTLE = 0.4

const TAU = Math.PI * 2

export type RingWobble = { show: () => void; hide: () => void }

/**
 * 建好暫停中的時間軸，交給 hover 事件開關。
 * 必須跑在 `useGSAP()` 裡 — 卸載時由它的 context 一次 revert 掉。
 *
 * @param frame 取景框本身（那個 overflow-hidden 的圓）
 */
export function createRingWobble(frame: HTMLElement): RingWobble {
  // 這裡不用 gsap.matchMedia()：它的價值在於條件不成立時自動 revert，而這組動畫
  // 是 hover 驅動、生命週期已經被 useGSAP 的 context 管著，用它只是多一層閉包。
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 補間的不是形狀，是一個角度。凸起的位置 = 角度本身，所以沒有「最後一格接回
  // 第一格」這件事 — 正弦本來就是週期的，繞回原點時值和速度都連續，接縫不存在。
  // （之前用 keyframes 逐格補間，每一格的 ease 在交界處把速度歸零，那個停頓就是
  // 會卡一下的地方；而正圓在 CSSOM 又永遠收合成單一個 `50%`，字串也對不上。）
  const wave = { angle: 0, amp: 0 }

  const write = () => {
    const k = wave.amp * AMP
    // 每條邊的兩個半徑固定加總 100%，邊上才不會留下一段直線。剩下四個自由度
    // 各差四分之一相位，凸起就會沿著邊繞。
    const a = k * Math.sin(wave.angle)
    const b = k * Math.sin(wave.angle + Math.PI)
    const c = k * Math.sin(wave.angle + Math.PI / 2)
    const d = k * Math.sin(wave.angle + Math.PI * 1.5)
    const p = (v: number) => `${(50 + v).toFixed(2)}%`
    frame.style.borderRadius =
      `${p(a)} ${p(-a)} ${p(-b)} ${p(b)} / ${p(c)} ${p(d)} ${p(-d)} ${p(-c)}`
  }

  // 等速轉，永遠不重設 angle：暫停再續播是從原地接下去，滑開又滑回來不會跳。
  const spin = gsap.to(wave, {
    angle: `+=${TAU}`,
    duration: MORPH,
    ease: 'none',
    repeat: -1,
    paused: true,
    onUpdate: write,
  })

  // 進出場動的是幅度，不是形狀 — 圓和波之間沒有中間形態要對齊，怎麼中斷都接得上。
  let fade: gsap.core.Tween | null = null
  const to = (amp: number, duration: number, ease: string, onComplete?: () => void) => {
    fade?.kill()
    fade = gsap.to(wave, { amp, duration: still ? 0 : duration, ease, onUpdate: write, onComplete })
  }

  return {
    show: () => {
      spin.resume()
      to(1, ENTER, 'sine.out')
    },
    hide: () => {
      to(0, SETTLE, 'power2.out', () => spin.pause())
    },
  }
}
