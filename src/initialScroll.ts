type InitialScrollEnvironment = {
  history: Pick<History, 'replaceState' | 'scrollRestoration'>
  location: Pick<Location, 'hash' | 'pathname' | 'search'>
  scrollTo: (x: number, y: number) => void
  onPageShow: (listener: () => void) => void
}

/** Start every page load at the Linktree screen instead of restoring About. */
export function resetInitialScroll({
  history,
  location,
  scrollTo,
  onPageShow,
}: InitialScrollEnvironment): void {
  history.scrollRestoration = 'manual'

  if (location.hash) {
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }

  const scrollToTop = () => scrollTo(0, 0)
  scrollToTop()
  onPageShow(scrollToTop)
}
