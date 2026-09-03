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

/** Wire the reset behavior to a real browser window and keep pageshow active for BFCache restores. */
export function resetBrowserInitialScroll(browserWindow: Window): void {
  resetInitialScroll({
    history: browserWindow.history,
    location: browserWindow.location,
    scrollTo: browserWindow.scrollTo.bind(browserWindow),
    reload: () => browserWindow.location.reload(),
    onPageShow: (listener) => browserWindow.addEventListener('pageshow', listener),
  })
}
