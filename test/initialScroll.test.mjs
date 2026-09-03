import assert from 'node:assert/strict'
import test from 'node:test'

import { resetInitialScroll } from '../src/initialScroll.ts'

test('initial load clears the fragment and starts at the top', () => {
  const replaced = []
  const scrolled = []
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
    onPageShow: (listener) => {
      onPageShow = listener
    },
  })

  assert.equal(history.scrollRestoration, 'manual')
  assert.deepEqual(replaced, [[null, '', '/links?preview=1']])
  assert.deepEqual(scrolled, [[0, 0]])

  assert.equal(typeof onPageShow, 'function')
  onPageShow()
  assert.deepEqual(scrolled, [
    [0, 0],
    [0, 0],
  ])
})
