import type { LinkGroup, LinkItem } from './types'

/** Drops hidden items, then drops groups left empty. Render from this, not the raw array. */
export function visibleGroups(groups: LinkGroup[]): LinkGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.hidden) }))
    .filter((group) => group.items.length > 0)
}

/** `external` when set, otherwise: anything leaving the site opens in a new tab. */
function isExternal(item: LinkItem): boolean {
  if (item.external !== undefined) return item.external
  return /^https?:\/\//i.test(item.href)
}

/**
 * The `<a>` attributes that open a link in a new tab, or nothing at all for links
 * that stay on the site (`mailto:`, `/resume.pdf`). Always safe to spread.
 */
export function newTabProps(item: LinkItem): { target?: '_blank'; rel?: string } {
  if (!isExternal(item)) return {}
  return { target: '_blank', rel: 'noreferrer noopener' }
}
