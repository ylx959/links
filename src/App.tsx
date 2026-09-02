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
      // 上下留白不對稱，整塊往下沉。內容加留白超過視窗高度時 justify-center 失效，
      // pt 就是 1:1 的下移量 — 想再往下就加大 pt。
      className="mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-40 pb-16"
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
