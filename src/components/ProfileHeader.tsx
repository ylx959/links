import type { Profile } from '../data'
import { Avatar } from './Avatar'

/** "Yang Lin-Hsuan" → "YL". Only ever seen if the avatar image fails to load. */
const initialsFrom = (name: string) =>
  name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export function ProfileHeader({ name, headline, avatar }: Profile) {
  return (
    
    <header className="flex flex-col items-center text-center">
      <Avatar {...avatar} initials={avatar.initials ?? initialsFrom(name)} />
      <h1 className="mt-6 text-[15px] font-semibold tracking-tight">{name}</h1>
      <p className="mt-1 text-[13px] tracking-tight text-ink-muted">{headline}</p>
    </header>
  )
}
