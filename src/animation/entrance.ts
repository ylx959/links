import gsap from 'gsap'

const entrance = {
  /** Start offset in px. Negative = starts above and drops into place. */
  y: -25,
  duration: 1.5,
  /** Lets the fonts land before anything moves. */
  delay: 0.15,
  /** Decelerating, no overshoot — the soft option. */
  ease: 'power2.out',
} as const

/** Fades and slides the page after the tab becomes visible; reduced motion skips playback. */
export function playEntrance(target: Element | null): (() => void) | undefined {
  if (!target) return

  let mm: ReturnType<typeof gsap.matchMedia> | null = null

  const start = () => {
    mm = gsap.matchMedia()
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
  }

  const onVisible = () => {
    if (document.visibilityState === 'hidden') return
    document.removeEventListener('visibilitychange', onVisible)
    start()
  }

  if (document.visibilityState === 'hidden') {
    document.addEventListener('visibilitychange', onVisible)
  } else {
    start()
  }

  return () => {
    document.removeEventListener('visibilitychange', onVisible)
    mm?.revert()
  }
}
