import assert from 'node:assert/strict'
import test from 'node:test'

import { resetBrowserInitialScroll, resetInitialScroll } from '../src/initialScroll.ts'

test('initial load clears the fragment and starts at the top', () => {
  const replaced = []
  const scrolled = []
  const reloads = []
  let onPageShow
  const history = {
    scrollRestoration: 'auto',
    replaceState: (...args) => replaced.push(args),
  }
  const location = {
    pathname: '/links',
    search: '?preview=1',
    hash: '#about',
  }

  resetInitialScroll({
    history,
    location,
    scrollTo: (...args) => scrolled.push(args),
    reload: () => reloads.push('reload'),
    onPageShow: (listener) => {
      onPageShow = listener
    },
  })

  assert.equal(history.scrollRestoration, 'manual')
  assert.deepEqual(replaced, [[null, '', '/links?preview=1']])
  assert.deepEqual(scrolled, [[0, 0]])

  assert.equal(typeof onPageShow, 'function')
  onPageShow({ persisted: false })
  assert.deepEqual(scrolled, [
    [0, 0],
    [0, 0],
  ])
  assert.deepEqual(reloads, [])
})

test('a page restored from the back-forward cache requests a clean reload', () => {
  const scrolled = []
  const reloads = []
  let onPageShow

  resetInitialScroll({
    history: {
      scrollRestoration: 'auto',
      replaceState: () => {},
    },
    location: {
      pathname: '/links',
      search: '',
      hash: '',
    },
    scrollTo: (...args) => scrolled.push(args),
    reload: () => reloads.push('reload'),
    onPageShow: (listener) => {
      onPageShow = listener
    },
  })

  assert.equal(typeof onPageShow, 'function')
  onPageShow({ persisted: true })

  assert.deepEqual(reloads, ['reload'])
  assert.deepEqual(scrolled, [[0, 0]])
})

test('browser wiring keeps listening after the initial pageshow', () => {
  const listeners = []
  const scrolled = []
  const reloads = []
  const browserWindow = {
    history: {
      scrollRestoration: 'auto',
      replaceState: () => {},
    },
    location: {
      pathname: '/links',
      search: '',
      hash: '',
      reload: () => reloads.push('reload'),
    },
    scrollTo: (...args) => scrolled.push(args),
    addEventListener: (type, listener, options) => {
      listeners.push({ type, listener, once: options?.once === true })
    },
  }

  const dispatchPageShow = (persisted) => {
    for (const registration of [...listeners]) {
      if (registration.type !== 'pageshow') continue
      registration.listener({ persisted })
      if (registration.once) listeners.splice(listeners.indexOf(registration), 1)
    }
  }

  resetBrowserInitialScroll(browserWindow)
  dispatchPageShow(false)
  dispatchPageShow(true)

  assert.deepEqual(scrolled, [
    [0, 0],
    [0, 0],
  ])
  assert.deepEqual(reloads, ['reload'])
})
