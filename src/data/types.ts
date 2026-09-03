import type { IconName } from '../icons/registry'

/** A single row in the link list. */
export interface LinkItem {
  /** Stable key. Also used for analytics / anchor targets. */
  id: string
  /** Visible text on the button. Say where it goes, in the person's own words. */
  label: string
  href: string
  icon: IconName
  /** Optional second line under the label. Leave out unless it adds information. */
  description?: string
  /** Opens in a new tab. Defaults to true for http(s), false for mailto:/tel:/#. */
  external?: boolean
  /** Keep the entry in the file but off the page. */
  hidden?: boolean
}

/** Links are always grouped, even when there is only one unlabelled group. */
export interface LinkGroup {
  id: string
  /** Rendered as a small caption above the group. Omit for a single flat list. */
  title?: string
  items: LinkItem[]
}

export interface Avatar {
  src: string
  /**
   * Scale applied inside the circle, 1 = untouched. Raise it when the source
   * carries wide margins or thin linework: cropping in fills the frame and
   * thickens the strokes, which is what keeps line art legible at this size.
   */
  zoom?: number
  /** Horizontal nudge inside the circle, in % of the frame. Positive moves the image right. */
  offsetX?: number
  /** Vertical nudge inside the circle, in % of the frame. Positive moves the image down. */
  offsetY?: number
  /** Describe the person, not the file. Empty string marks it decorative. */
  alt: string
  /** Shown if the image fails to load. Falls back to the initials of `profile.name`. */
  initials?: string
}

/** The screen that lives below the fold. Leave it out and the page is one screen. */
export interface About {
  /**
   * Only ever read aloud. The visible heading is the handwritten SVG, which is
   * marked decorative — keep this the same words so both audiences get one page.
   */
  heading: string
  /**
   * The paragraphs in playback order. Each fades in, waits to be read, then falls
   * out of view. After the final paragraph, the heading erases and the signature draws.
   *
   * Where a paragraph breaks into lines is the layout's business, not this string's.
   */
  paragraphs: string[]
}

export interface Quote {
  text: string
  author?: string
}

export interface Profile {
  name: string
  /** One line under the name: role, place, current focus. */
  headline: string
  avatar: Avatar
  quote?: Quote
}

/** Document head + social card. */
export interface SiteMeta {
  title: string
  description: string
  /** Canonical origin, no trailing slash. */
  url: string
}

export interface SiteConfig {
  meta: SiteMeta
  profile: Profile
  /** The main stack of full-width buttons. */
  groups: LinkGroup[]
  /** Secondary links, rendered as an icon-only row above the copyright. */
  footerLinks: LinkItem[]
  footer?: string
  /** Scroll past the links and this is what's there. */
  about?: About
}
