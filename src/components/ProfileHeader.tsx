import type { Profile } from '../data'
import { Avatar } from './Avatar'

/** "Yang Lin-Hsuan" → "YL". Only ever seen if the avatar image fails to load. */
function initialsFrom(name: string): string {
  return name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ProfileHeader({ name, headline, avatar }: Profile) {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="flex size-[88px] items-center justify-center sm:size-[108px]">
        <div className="scale-[0.815] sm:scale-100">
          <Avatar {...avatar} initials={avatar.initials ?? initialsFrom(name)} />
        </div>
      </div>
      <h1 className="mt-4 text-[18px] font-semibold tracking-tight sm:mt-6">{name}</h1>
      <p className="mt-1 text-[12px] tracking-tight text-ink-muted sm:text-[13px]">{headline}</p>
    </header>
  )
}
