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
        // 手機版縮短頂部與內容間距，並用 pb-20 替藍點保留完整 44px 點擊區。
        // sm 以上恢復原本的 pt-48 / pb-8 與寬鬆間距。
        className="relative mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-6 pb-20 sm:pt-48 sm:pb-8"
      >
        {/* 手機版整組下移，但藍點是外面的 sibling，所以仍固定在原本的底部位置。 */}
        <div className="translate-y-14 sm:translate-y-0">
          <div className="flex flex-col gap-5 sm:gap-9">
            <ProfileHeader {...profile} />
            <LinkList groups={groups} />
            {profile.quote && <QuoteBlock {...profile.quote} />}
          </div>

          <footer className="mt-6 flex flex-col items-center gap-1 sm:mt-12 sm:gap-3">
            <IconLinkRow items={footerLinks} />
            {footer && <p className="text-[12px] text-ink-faint">{footer}</p>}
          </footer>
        </div>

        {about && <ScrollCue targetId="about" label={about.heading} />}
      </section>

      {about && <AboutSection {...about} />}
    </main>
  )
}
