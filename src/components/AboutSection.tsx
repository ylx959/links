import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import type { About } from '../data'
import { playAboutReveal } from '../animation/aboutReveal'
// DrawSVG 需要直接存取 path，因此在建置時內嵌 SVG 標記。
import signatureMarkup from '../assets/about-signature.svg?raw'
import signOffMarkup from '../assets/signature.svg?raw'

/** 桌面版以 vw/dvh 維持設計稿比例與斷行，sm 以下改為單欄。 */
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

      {/* 收尾簽名脫離文件流，固定在區塊中央。寫完之後會一直輕輕漂浮，hover 再微微放大。 */}
      <div
        data-signoff
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
      >
        {/* 滑鼠要摸得到的就是簽名這一塊，不是整個覆蓋層 —— pointer-events 由動畫在
            寫完最後一筆時才打開，在那之前它不該擋住底下段落的選取。 */}
        <div
          data-signoff-hit
          className="signature w-[60vw] sm:w-[26vw]"
          // 內容是 build 時就固定的本地檔案，不是任何外部輸入。
          dangerouslySetInnerHTML={{ __html: signOffMarkup }}
        />
      </div>
    </section>
  )
}
