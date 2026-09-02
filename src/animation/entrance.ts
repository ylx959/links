import gsap from 'gsap'

export const entrance = {
  /** Start offset in px. Negative = starts above and drops into place. */
  y: -16,
  duration: 1.5,
  /** Lets the fonts land before anything moves. */
  delay: 0.15,
  /** Decelerating, no overshoot — the soft option. */
  ease: 'power2.out',
} as const

/**
 * Fade + downward slide for the page as a single block — no stagger, everything moves together.
 * Skipped entirely under `prefers-reduced-motion`.
 * Runs inside a `useGSAP()` context, which reverts the matchMedia on unmount.
 */
export function playEntrance(target: Element | null) {
  if (!target) return

  // A background tab throttles requestAnimationFrame, so the tween would sit at
  // autoAlpha 0 and the page would look empty until the tab is focused.
  // Nothing to reveal if nobody is looking — show the content and skip the intro.
  if (document.visibilityState === 'hidden') return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from(target, {
      autoAlpha: 0,
      y: entrance.y,
      duration: entrance.duration,
      ease: entrance.ease,
      delay: entrance.delay,
      // Hand the styles back to CSS so nothing inline lingers on the container.
      clearProps: 'transform,opacity,visibility',
    })
  })

  return mm
}
