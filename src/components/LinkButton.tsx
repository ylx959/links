import { icons } from '../icons/registry'
import { isExternal, type LinkItem } from '../data'

/**
 * Pill outline button: the brand mark sits in a filled puck on the right. On hover the puck
 * travels to the left edge, the mark gives way to an arrow, and the label steps
 * aside — the button rearranges itself around the act of leaving.
 *
 * `@container` makes the pill its own container so the puck's travel distance
 * (`100cqw`) is the pill's own width. That keeps the move on `transform` instead
 * of animating `right`, so no layout runs per frame.
 */

/**
 * 圓圈位移與文字讓位共用這一組時間 — 要調快慢改這裡就好。
 * 進場 1000ms（`group-hover:duration-1000`），退場 300ms：
 * 滑開時應該立刻收回，用同樣的長度會拖沓。
 */
const TRAVEL = 'duration-600 ease-out group-hover:duration-1000'

/** 圓圈裡兩個圖示的交叉淡入淡出，比位移短一截，才不會蓋掉移動本身。 */
const SWAP = 'duration-200 group-hover:duration-500'

export function LinkButton({ item }: { item: LinkItem }) {
  const Icon = icons[item.icon]
  const external = isExternal(item)

  return (
    <a
      href={item.href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className="group @container relative flex h-12 items-center rounded-full border-[0.25px] border-ink/30 bg-black/4 transition-transform duration-200 ease-out active:scale-[0.995]"
    >
      {/* 內距放在這裡而不是 <a>：container-type 以內容框計算 cqw，
          <a> 有內距的話 100cqw 就不等於按鈕寬度了。 */}
      <span
        className={`relative z-10 min-w-0 flex-1 pr-14 pl-6 transition-transform group-hover:translate-x-8 ${TRAVEL}`}
      >
        <span className="block truncate font-serif text-[15px] leading-snug">{item.label}</span>
        {item.description && (
          <span className="mt-0.5 block truncate text-[12px] leading-snug opacity-70">
            {item.description}
          </span>
        )}
      </span>

      {/* The puck. Rest: flush right, showing the brand mark. Hover: flush left, showing the arrow.
          外框是 0.25px 描邊，吃掉高寬各 0.5px：內距 3.75px 才置中，位移距離也跟著扣成 puck 40px + 兩側 3.75px。 */}
      <span
        className={`absolute top-[3.75px] right-[3.75px] flex size-10 items-center justify-center rounded-full bg-ink text-page transition-transform group-hover:-translate-x-[calc(100cqw-47.5px)] ${TRAVEL}`}
      >
        <Icon className={`absolute size-4 transition-opacity group-hover:opacity-0 ${SWAP}`} />
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`absolute size-4 opacity-0 transition-all group-hover:rotate-45 group-hover:opacity-100 ${SWAP}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </a>
  )
}
