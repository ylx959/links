import { icons } from '../icons/registry'
import { newTabProps, type LinkItem } from '../data'

/** Icon-only links use labels for screen readers and hover tooltips. */
export function IconLinkRow({ items }: { items: LinkItem[] }) {
  if (items.length === 0) return null

  return (
    <ul className="flex items-center justify-center gap-1">
      {items.map((item) => {
        const Icon = icons[item.icon]

        return (
          <li key={item.id}>
            <a
              href={item.href}
              aria-label={item.label}
              title={item.label}
              {...newTabProps(item)}
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
