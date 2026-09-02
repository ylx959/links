import type { LinkGroup } from '../data'
import { LinkButton } from './LinkButton'

export function LinkList({ groups }: { groups: LinkGroup[] }) {
  return (
    <nav aria-label="Links" className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={group.title ? `group-${group.id}` : undefined}>
          {group.title && (
            <h2
              id={`group-${group.id}`}
              className="mb-2.5 px-1 text-[11px] font-medium tracking-[0.14em] text-ink-faint uppercase"
            >
              {group.title}
            </h2>
          )}
          <ul className="flex flex-col gap-2.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <LinkButton item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
