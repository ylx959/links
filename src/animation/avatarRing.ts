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

/** 繞一圈的秒數。慢一點才像在浮，不像在抖；但太慢波峰就走不完一圈，看不出在動。 */
const MORPH = 5
/**
 * 幾圈才回到同一個形狀。主波走 TURNS 圈的同時副波走 SUB 圈，兩者互質 —
 * 要滿 TURNS 圈才重新對齊，中間每一圈的輪廓都不一樣，看不出「又轉回來了」。
 * 兩個都是整數，所以週期結尾的相位剛好接回開頭，接縫仍然不存在。
 */
const TURNS = 3
const SUB = 2
/** 副波佔的比例。太小蓋不掉主波的對稱，太大就聽得出兩拍在打架。 */
const SKEW = 0.42
/**
 * 形變幅度（半徑的 %）。每條邊的兩個半徑固定加總 100%，所以上限是 50 —
 * 到那裡某個半徑會歸零、邊上出現尖角。這個值以「看得出在擺」為準往上抓。
 */
const AMP = 16
/** hover 進場、滑開收回的時間。收得比進場快 — 滑開就該立刻收，拖著會黏。 */
const ENTER = 0.9
const SETTLE = 0.4

const TAU = Math.PI * 2

/**
 * 四個自由度（上、下、左、右四條邊各自的分配）的相位與權重。
 *
 * 相位刻意不是均分的四分之一圈，權重也各不相同：之前四個值鎖在等距相位、等幅，
 * 合起來就是一顆正橢圓在原地轉，兩軸完全鏡射。錯開之後凸起繞邊時有的地方鼓、
 * 有的地方扁，軌跡才不對稱。
 *
 * weight ≤ 1 且兩條波的係數加總為 1，所以單邊擺幅永遠不超過 AMP，尖角的上限
 * 條件不受影響。
 */
const LOBES = [
  { weight: 1.0, phase: 0.0, sub: 0.0 }, // 上緣
  { weight: 0.68, phase: 2.6, sub: 1.9 }, // 下緣
  { weight: 0.86, phase: 1.15, sub: 3.7 }, // 左緣
  { weight: 0.55, phase: 4.35, sub: 5.4 }, // 右緣
]

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
    const lobe = (l: (typeof LOBES)[number]) =>
      k *
      l.weight *
      ((1 - SKEW) * Math.sin(wave.angle + l.phase) +
        SKEW * Math.sin((wave.angle * SUB) / TURNS + l.sub))
    // 每條邊的兩個半徑固定加總 100%，邊上才不會留下一段直線；四條邊之間則各走
    // 各的，凸起沿著邊繞的同時形狀也一直在換。
    const [a, b, c, d] = LOBES.map(lobe)
    const p = (v: number) => `${(50 + v).toFixed(2)}%`
    frame.style.borderRadius =
      `${p(a)} ${p(-a)} ${p(-b)} ${p(b)} / ${p(c)} ${p(d)} ${p(-d)} ${p(-c)}`
  }

  // 等速轉，永遠不重設 angle：暫停再續播是從原地接下去，滑開又滑回來不會跳。
  const spin = gsap.to(wave, {
    angle: `+=${TAU * TURNS}`,
    duration: MORPH * TURNS,
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
