import type { SiteConfig } from './types'
import { profile } from './profile'
import { groups, footerLinks } from './links'

export const site: SiteConfig = {
  meta: {
    title: 'YLX | LinkTree',
    description: profile.headline,
    url: 'https://linktree.ylx-studio.com/',
  },
  profile,
  groups,
  footerLinks,
  footer: `© ${new Date().getFullYear()} ${profile.name}`,
}
