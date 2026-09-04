import gsap from 'gsap'

/** 頭貼 hover 的波動外框；只改 border-radius，避免照片跟著旋轉。 */

/** 繞一圈的秒數。慢一點才像在浮，不像在抖；但太慢波峰就走不完一圈，看不出在動。 */
const MORPH = 5
/** 主副波以互質圈數運行，週期結尾相位相接且每圈輪廓不同。 */
const TURNS = 3
const SUB = 2
/** 副波佔的比例。太小蓋不掉主波的對稱，太大就聽得出兩拍在打架。 */
const SKEW = 0.42
/** 半徑形變幅度（%）；必須低於 50，否則邊緣會出現尖角。 */
const AMP = 16
/** hover 進場、滑開收回的時間。收得比進場快 — 滑開就該立刻收，拖著會黏。 */
const ENTER = 0.9
const SETTLE = 0.4

const TAU = Math.PI * 2

/** 四邊使用不同相位與權重形成不對稱輪廓；weight ≤ 1 確保擺幅不超過 AMP。 */
const LOBES = [
  { weight: 1.0, phase: 0.0, sub: 0.0 }, // 上緣
  { weight: 0.68, phase: 2.6, sub: 1.9 }, // 下緣
  { weight: 0.86, phase: 1.15, sub: 3.7 }, // 左緣
  { weight: 0.55, phase: 4.35, sub: 5.4 }, // 右緣
]

export type RingWobble = { show: () => void; hide: () => void }

/** 建立由 hover 控制的暫停時間軸；須在 useGSAP context 中呼叫。 */
export function createRingWobble(frame: HTMLElement): RingWobble {
  // 這裡不用 gsap.matchMedia()：它的價值在於條件不成立時自動 revert，而這組動畫
  // 是 hover 驅動、生命週期已經被 useGSAP 的 context 管著，用它只是多一層閉包。
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // 以連續正弦角度補間，避免 keyframe 接縫停頓與 CSSOM 字串差異。
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
