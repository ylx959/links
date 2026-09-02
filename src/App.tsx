import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { site, visibleGroups } from './data'
import { playEntrance } from './animation/entrance'
import { ProfileHeader } from './components/ProfileHeader'
import { LinkList } from './components/LinkList'
import { QuoteBlock } from './components/QuoteBlock'
import { IconLinkRow } from './components/IconLinkRow'

export default function App() {
  const { profile, footerLinks, footer } = site
  const groups = visibleGroups(site.groups)
  const root = useRef<HTMLElement>(null)

  useGSAP(() => playEntrance(root.current), { scope: root })

  return (
    <main
      ref={root}
      // 整塊的垂直位置。justify-center 會把剩餘空間平分到上下，所以單獨加大 pt
      // 只會下移一半。要精準下移 N px：pt 加 N、pb 減 N（總和不變 = 剩餘空間不變）。
      // 一格 = 4px，所以 pt-40→pt-48 / pb-16→pb-8 就是往下 32px。
      className="mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-48 pb-8"
    >
      <div className="flex flex-col gap-9">
        <ProfileHeader {...profile} />
        <LinkList groups={groups} />
        {profile.quote && <QuoteBlock {...profile.quote} />}
      </div>

      <footer className="mt-12 flex flex-col items-center gap-3">
        <IconLinkRow items={footerLinks} />
        {footer && <p className="text-[12px] text-ink-faint">{footer}</p>}
      </footer>
    </main>
  )
}
