import { useLayoutEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { site, visibleGroups } from './data'
import { playEntrance } from './animation/entrance'
import { ProfileHeader } from './components/ProfileHeader'
import { LinkList } from './components/LinkList'
import { QuoteBlock } from './components/QuoteBlock'
import { IconLinkRow } from './components/IconLinkRow'
import { ScrollClue } from './components/ScrollClue'
import { AboutSection } from './components/AboutSection'
import { fitToViewport } from './fitToViewport'

/** 彈性留白能縮到的最小高度（getComputedStyle 讀的是 Tailwind 的 min-h）。 */
const minHeight = (el: HTMLElement | null) => (el ? parseFloat(getComputedStyle(el).minHeight) || 0 : 0)

export default function App() {
  const { profile, footerLinks, footer, about } = site
  const groups = visibleGroups(site.groups)
  const hub = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)

  // 進場只管第一屏。About 那屏是捲到才演的，被一起淡入的話彩蛋就先被打開了。
  useGSAP(() => playEntrance(hub.current), { scope: hub })

  useLayoutEffect(() => {
    if (!content.current) return
    return fitToViewport(content.current, () => minHeight(top.current) + minHeight(bottom.current))
  }, [])

  return (
    <main>
      <section
        ref={hub}
        // 第一屏剛好一個畫面高：© 與藍點一開始就要看得到，也不能互相壓到。
        className="relative mx-auto flex h-dvh max-w-[28rem] flex-col px-6"
      >
        {/* 上下兩塊留白一起長（等於置中），畫面不夠高時一起縮，各最少留 24px。
            基準值讓內容偏下：置中偏移 = (上 − 下) / 2，手機 48px、sm 以上 96px。 */}
        <div ref={top} aria-hidden className="min-h-6 flex-[1_1_7.5rem] sm:flex-[1_1_14rem]" />

        {/* 留白縮到底仍放不下時，fitToViewport 會用 zoom 把整組縮小。 */}
        <div ref={content} className="shrink-0">
          <div className="flex flex-col gap-4 sm:gap-9">
            <ProfileHeader {...profile} />
            <LinkList groups={groups} />
            {profile.quote && <QuoteBlock {...profile.quote} />}
          </div>

          {/* 圖示列、©、藍點排成一組跟著內容走，彼此距離在任何螢幕都固定。 */}
          <footer className="mt-3 flex flex-col items-center sm:mt-12">
            <IconLinkRow items={footerLinks} />
            {footer && <p className="text-[12px] text-ink-faint">{footer}</p>}
            {about && <ScrollClue targetId="about" label={about.heading} />}
          </footer>
        </div>

        <div ref={bottom} aria-hidden className="min-h-6 flex-[1_1_1.5rem] sm:flex-[1_1_2rem]" />
      </section>

      {about && <AboutSection {...about} />}
    </main>
  )
}
