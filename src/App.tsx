import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { site, visibleGroups } from './data'
import { playEntrance } from './animation/entrance'
import { ProfileHeader } from './components/ProfileHeader'
import { LinkList } from './components/LinkList'
import { QuoteBlock } from './components/QuoteBlock'
import { IconLinkRow } from './components/IconLinkRow'
import { ScrollCue } from './components/ScrollCue'
import { AboutSection } from './components/AboutSection'

export default function App() {
  const { profile, footerLinks, footer, about } = site
  const groups = visibleGroups(site.groups)
  const hub = useRef<HTMLElement>(null)

  // 進場只管第一屏。About 那屏是捲到才演的，被一起淡入的話彩蛋就先被打開了。
  useGSAP(() => playEntrance(hub.current), { scope: hub })

  return (
    <main>
      <section
        ref={hub}
        // 手機版的 pb-20 替底部藍點保留完整 44px 點擊區和間距，避免壓到 footer。
        // sm 以上維持原本的 pb-8；justify-center 會把剩餘空間平分到上下。
        className="relative mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-48 pb-20 sm:pb-8"
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

        {about && <ScrollCue targetId="about" label={about.heading} />}
      </section>

      {about && <AboutSection {...about} />}
    </main>
  )
}
