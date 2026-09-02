import { icons } from '../icons/registry'
import { isExternal, type LinkItem } from '../data'

/**
 * Icon-only links. The label never renders, so it carries the accessible name
 * instead — `aria-label` for screen readers, `title` for the hover tooltip.
 */
export function IconLinkRow({ items }: { items: LinkItem[] }) {
  if (items.length === 0) return null

  return (
    <ul className="flex items-center justify-center gap-1">
      {items.map((item) => {
        const Icon = icons[item.icon]
        const external = isExternal(item)

        return (
          <li key={item.id}>
            <a
              href={item.href}
              aria-label={item.label}
              title={item.label}
              {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              className="flex size-10 items-center justify-center rounded-full text-ink-faint transition-colors duration-500 ease-out hover:bg-line/60 hover:text-ink"
            >
              <Icon className="size-4" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
