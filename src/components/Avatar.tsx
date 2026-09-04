import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { createRingWobble, type RingWobble } from '../animation/avatarRing'
import type { Avatar as AvatarData } from '../data'

/** 頭貼直徑（px）。改這一個數字就好 — 容器、圖片、縮寫字級都跟著走。 */
const AVATAR_SIZE = 108

/** Hover 時的取景框直徑；不得超過照片尺寸，否則邊緣會露出底色。 */
const AVATAR_HOVER_SIZE = 120

/** Splits a requested nudge between object-position and image offset without exposing the frame. */
function resolveNudge(
  offset: number,
  slack: number,
  rendered: number,
  frame: number,
): { objectPct: number; shift: number } {
  const cropBudget = slack / 2
  // Hold back a pixel: at fractional device ratios an exactly-flush edge can
  // still round to a hairline of container showing through.
  const overhangBudget = Math.max((rendered - frame) / (2 * frame) - 1 / frame, 0)

  const sign = Math.sign(offset)
  const total = Math.min(Math.abs(offset) / 100, cropBudget + overhangBudget) * sign
  const viaCrop = Math.min(Math.abs(total), cropBudget) * sign

  return {
    // 0% = crop pinned to the source's left/top edge, which pushes the image right/down.
    objectPct: slack > 0 ? 50 - (viaCrop / slack) * 100 : 50,
    shift: (total - viaCrop) * frame,
  }
}

export function Avatar({ src, alt, initials = '', zoom = 1, offsetX = 0, offsetY = 0 }: AvatarData) {
  const [failed, setFailed] = useState(false)
  const [aspect, setAspect] = useState(1)
  const [open, setOpen] = useState(false)

  const box = useRef<HTMLDivElement>(null)
  const frameEl = useRef<HTMLDivElement>(null)
  const wobble = useRef<RingWobble>(null)

  useGSAP(
    () => {
      if (frameEl.current) wobble.current = createRingWobble(frameEl.current)
    },
    { scope: box },
  )

  // Use layout dimensions instead of transform so the browser samples the raster only once.
  const rendered = AVATAR_SIZE * zoom
  // 只有取景框會變，照片不會 — `rendered` 刻意不吃 `frame`。
  const frame = open ? AVATAR_HOVER_SIZE : AVATAR_SIZE
  const inset = (frame - rendered) / 2

  // 框張到最大時 overhang 最少，用那一版算 budget，兩個狀態都不會露出底色。
  const x = resolveNudge(offsetX, Math.max(aspect - 1, 0), rendered, AVATAR_HOVER_SIZE)
  const y = resolveNudge(offsetY, Math.max(1 / aspect - 1, 0), rendered, AVATAR_HOVER_SIZE)

  return (
    // 外層尺寸固定：圓框從中心往外長，下面的名字才不會被推著跳。
    <div
      ref={box}
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="relative flex items-center justify-center"
      onMouseEnter={() => {
        setOpen(true)
        wobble.current?.show()
      }}
      onMouseLeave={() => {
        setOpen(false)
        wobble.current?.hide()
      }}
    >
      <div
        ref={frameEl}
        style={{ width: frame, height: frame }}
        className="absolute overflow-hidden rounded-full bg-raised shadow-raised outline-1 -outline-offset-1 outline-line transition-[width,height] duration-300 ease-out"
      >
        {failed ? (
          <div
            style={{ fontSize: AVATAR_SIZE * 0.28 }}
            className="flex size-full items-center justify-center font-serif text-ink-muted"
          >
            {initials}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            width={Math.round(rendered)}
            height={Math.round(rendered)}
            decoding="async"
            draggable={false}
            style={{
              width: rendered,
              height: rendered,
              left: inset + x.shift,
              top: inset + y.shift,
              objectPosition: `${x.objectPct}% ${y.objectPct}%`,
            }}
            className="absolute max-w-none object-cover transition-[left,top] duration-300 ease-out select-none"
            onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  )
}
