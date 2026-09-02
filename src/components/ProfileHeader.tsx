import type { Profile } from '../data'
import { Avatar } from './Avatar'

export function ProfileHeader({ name, headline, avatar }: Profile) {
  return (
    <header className="flex flex-col items-center text-center">
      <Avatar {...avatar} />
      <h1 className="mt-6 text-[15px] font-semibold tracking-tight">{name}</h1>
      <p className="mt-1 text-[15px] tracking-tight text-ink-muted">{headline}</p>
    </header>
  )
}
