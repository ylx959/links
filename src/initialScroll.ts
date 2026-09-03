type PageShowState = Pick<PageTransitionEvent, 'persisted'>

type InitialScrollEnvironment = {
  history: Pick<History, 'replaceState' | 'scrollRestoration'>
  location: Pick<Location, 'hash' | 'pathname' | 'search'>
  scrollTo: (x: number, y: number) => void
  reload: () => void
  onPageShow: (listener: (event: PageShowState) => void) => void
}

/** Start every page load at the Linktree screen instead of restoring About. */
export function resetInitialScroll({
  history,
  location,
  scrollTo,
  reload,
  onPageShow,
}: InitialScrollEnvironment): void {
  history.scrollRestoration = 'manual'

  if (location.hash) {
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }

  const scrollToTop = () => scrollTo(0, 0)
  scrollToTop()
  onPageShow((event) => {
    if (event.persisted) {
      reload()
      return
    }

    scrollToTop()
  })
}
