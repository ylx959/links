import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import type { About } from '../data'
import { playAboutReveal } from '../animation/aboutReveal'
// DrawSVG 需要直接存取 path，因此在建置時內嵌 SVG 標記。
import signatureMarkup from '../assets/about-signature.svg?raw'
import signOffMarkup from '../assets/signature.svg?raw'

/**
 * 版面比例照設計稿量出來的，稿子 = 一整個螢幕，所以所有尺寸都是 vw／dvh：
 *
 *   落款   left 10.3vw、width 62.5vw、top 13dvh
 *   段落   width 42.5vw、右緣離邊 20.5vw（於是左緣落在 37vw）、與落款距 14.5dvh
 *   內文   font-size 2vw ← 跟著寬度縮放，所以不管螢幕多大都斷成一樣的行數
 *
 * 段落跟在固定長寬比的 SVG 後方，避免扁螢幕下重疊。vw 字級維持斷行比例，clamp 限制
 * 極端尺寸；sm 以下改為單欄。overflow-hidden 裁掉落出區塊的絕對定位單字。
 */
export function AboutSection({ heading, paragraphs }: About) {
  const root = useRef<HTMLElement>(null)

  useGSAP(() => playAboutReveal(root.current), { scope: root })

  return (
    <section
      id="about"
      ref={root}
      aria-labelledby="about-heading"
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 py-24 sm:justify-start sm:pt-[13dvh] sm:pr-[20.5vw] sm:pb-[6dvh] sm:pl-[10.3vw]"
    >
      {/* 看得見的標題是手寫 SVG，它被標成裝飾性的，所以真正的 h2 留在這裡給朗讀器。 */}
      <h2 id="about-heading" className="sr-only">
        {heading}
      </h2>

      <div
        data-signature
        aria-hidden="true"
        className="signature w-full sm:w-[62.5vw]"
        // 內容是 build 時就固定的本地檔案，不是任何外部輸入。
        dangerouslySetInnerHTML={{ __html: signatureMarkup }}
      />

      {/* 段落共用同一個 grid 格子；relative 容器是掉落單字的座標原點。 */}
      <div
        data-stage
        className="relative mt-10 grid sm:mt-[14.5dvh] sm:ml-auto sm:w-[42.5vw]"
      >
        {paragraphs.map((text, i) => (
          <p
            key={i}
            data-para
            className="col-start-1 row-start-1 z-[1] text-[15px] leading-[1.75] text-pretty sm:text-[clamp(0.95rem,2vw,1.9rem)] sm:leading-[1.4]"
          >
            {text}
          </p>
        ))}
      </div>

      {/* 收尾簽名脫離文件流，固定在區塊中央。 */}
      <div
        data-signoff
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
      >
        <div
          className="signature w-[60vw] sm:w-[26vw]"
          // 內容是 build 時就固定的本地檔案，不是任何外部輸入。
          dangerouslySetInnerHTML={{ __html: signOffMarkup }}
        />
      </div>
    </section>
  )
}
