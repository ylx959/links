import { useState } from 'react'
import type { Avatar as AvatarData } from '../data'

/** 頭貼直徑（px）。改這一個數字就好 — 容器、圖片、縮寫字級都跟著走。 */
export const AVATAR_SIZE = 100

export function Avatar({ src, alt, initials }: AvatarData) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
      className="overflow-hidden rounded-full border border-line bg-raised shadow-raised"
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
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
