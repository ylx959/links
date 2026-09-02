import { useState } from 'react'
import type { Avatar as AvatarData } from '../data'

/** 頭貼直徑（px）。改這一個數字就好 — 容器、圖片、縮寫字級都跟著走。 */
export const AVATAR_SIZE = 140

/**
 * Turns one requested nudge into the two mechanisms that can deliver it without
 * ever exposing the container behind the image.
 *
 * `object-cover` already oversizes the source on one axis and clips the excess;
 * `object-position` slides the crop across that excess for free. Only what the
 * cover crop cannot supply falls to an offset of the image box itself, whose
 * budget is the overhang `zoom` creates. Asking for more than both budgets
 * together is what puts a white crescent in the circle, so the request is
 * capped at their sum.
 *
 * @param offset  requested nudge, % of the frame; positive moves the image right / down
 * @param slack   cover overflow on this axis, as a fraction of the frame
 * @returns       `objectPct` for object-position, `shift` in px against the frame
 */
function resolveNudge(offset: number, slack: number, zoom: number) {
  const cropBudget = slack / 2
  const overhangBudget = (zoom - 1) / 2

  const sign = Math.sign(offset)
  const total = Math.min(Math.abs(offset) / 100, cropBudget + overhangBudget) * sign
  const viaCrop = Math.min(Math.abs(total), cropBudget) * sign

  return {
    // 0% = crop pinned to the source's left/top edge, which pushes the image right/down.
    objectPct: slack > 0 ? 50 - (viaCrop / slack) * 100 : 50,
    shift: (total - viaCrop) * AVATAR_SIZE,
  }
}

export function Avatar({ src, alt, initials = '', zoom = 1, offsetX = 0, offsetY = 0 }: AvatarData) {
  const [failed, setFailed] = useState(false)
  const [aspect, setAspect] = useState(1)

  // Zoom is the image's real layout size, never a CSS transform: a transform
  // would upscale a raster the browser already sampled down to 140px, and the
  // resampling artefacts in that raster are what read as grain. Sizing the
  // element instead lets the browser sample the source straight to its final
  // pixel size, once.
  const rendered = AVATAR_SIZE * zoom
  const inset = (AVATAR_SIZE - rendered) / 2

  const x = resolveNudge(offsetX, Math.max(aspect - 1, 0), zoom)
  const y = resolveNudge(offsetY, Math.max(1 / aspect - 1, 0), zoom)

  return (
    <div
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="relative overflow-hidden rounded-full border border-line bg-raised shadow-raised"
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
          style={{
            width: rendered,
            height: rendered,
            left: inset + x.shift,
            top: inset + y.shift,
            objectPosition: `${x.objectPct}% ${y.objectPct}%`,
          }}
          className="absolute max-w-none object-cover"
          onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
