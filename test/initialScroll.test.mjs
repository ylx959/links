import assert from 'node:assert/strict'
import test from 'node:test'

import { resetInitialScroll } from '../src/initialScroll.ts'

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
