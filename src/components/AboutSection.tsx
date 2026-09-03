import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import type { About } from '../data'
import { playAboutReveal } from '../animation/aboutReveal'
// ?raw 是 Vite 內建的：SVG 原始碼在 build 時就內嵌進 bundle。
// 不走 <img> 是因為 DrawSVG 要摸得到裡面每一條 <path> —— 圖片裡的路徑碰不到。
import signatureMarkup from '../assets/about-signature.svg?raw'

/**
 * 版面比例照設計稿量出來的，稿子 = 一整個螢幕，所以所有尺寸都是 vw／dvh：
 *
 *   落款   left 4vw、width 48vw、top 10dvh
 *   段落   width 60.7vw、右緣離邊 2.9vw（於是左緣落在 36.4vw）、與落款距 5dvh
 *   內文   font-size 1.6vw ← 跟著寬度縮放，所以不管螢幕多大都斷成一樣的行數
 *
 * 落款原本照稿子是 68.4vw，後來收到 48vw、上下的留白也一起縮 —— 不是嫌它大，是為了
 * 把段落往上推。講完的話會掉下來堆在腳邊，那堆東西需要地方長高；落款佔掉的每一分
 * 高度，都是從那堆字的頭頂扣的。
 *
 * 字級用 vw 是這裡的關鍵：固定 px 的話，螢幕一大行就變長、段落的行數就變了，
 * 比例就散了。clamp 的兩端只是安全閥 —— 超大螢幕不要變成看板，筆電也不要小到看不清。
 *
 * sm 以下整個換成單欄：60vw 的段落在手機上是一行三個字，比例守不住也不該守。
 */
export function AboutSection({ heading, paragraphs }: About) {
  const root = useRef<HTMLElement>(null)

  useGSAP(() => playAboutReveal(root.current), { scope: root })

  return (
    <section
      id="about"
      ref={root}
      aria-labelledby="about-heading"
      className="flex min-h-dvh flex-col justify-center px-6 py-24 sm:justify-start sm:pt-[10dvh] sm:pr-[2.9vw] sm:pb-[12dvh] sm:pl-[4vw]"
    >
      {/* 看得見的標題是手寫 SVG，它被標成裝飾性的，所以真正的 h2 留在這裡給朗讀器。 */}
      <h2 id="about-heading" className="sr-only">
        {heading}
      </h2>

      <div
        data-signature
        aria-hidden="true"
        className="signature w-full sm:w-[48vw]"
        // 內容是 build 時就固定的本地檔案，不是任何外部輸入。
        dangerouslySetInnerHTML={{ __html: signatureMarkup }}
      />

      {/* 段落往右退，落在落款的下半段底下 —— 第一屏全部置中，這裡刻意不對齊。
          外面這層只管定位，掉下去的字要靠它當定位原點，所以 relative 掛在這裡而不是 <p> 上。

          四段全部疊在同一個 grid 格子裡（都是 row/col 1），所以它們共用同一個左上角，
          而容器的高度自動取最高的那一段。用絕對定位疊的話容器會塌成第一段的高度，
          比較長的段落就會溢出去。

          每一段都給 z-index：掉下去的字是 absolute，而 absolute 一定畫在同層的靜態
          內容之上 —— 不指定層級的話，堆起來的字會蓋在還沒講完的那一段上面。給了層級
          之後就換成 DOM 順序說話：後面的段落畫在前面那堆字之上，最後一段永遠在最上層，
          底下那堆是它的沉積物。z-index 對 grid item 直接生效，不必加 position，
          所以掉下去的字仍然是相對 [data-stage] 定位的。 */}
      <div
        data-stage
        className="relative mt-10 grid sm:mt-[5dvh] sm:ml-auto sm:w-[60.7vw]"
      >
        {paragraphs.map((text, i) => (
          <p
            key={i}
            data-para
            className="col-start-1 row-start-1 z-[1] text-[14px] leading-[1.75] text-pretty sm:text-[clamp(0.85rem,1.6vw,1.5rem)] sm:leading-[1.45]"
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  )
}
