import assert from 'node:assert/strict'
import test from 'node:test'
import gsap from 'gsap'
import { playEntrance } from '../src/animation/entrance.ts'

test('a hidden page starts its entrance when it becomes visible', () => {
  const originalDocument = globalThis.document
  const originalMatchMedia = gsap.matchMedia
  const listeners = new Map()
  let visibilityState = 'hidden'
  let starts = 0

  globalThis.document = {
    get visibilityState() {
      return visibilityState
    },
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
  }
  gsap.matchMedia = () => ({
    add: () => {
      starts += 1
    },
    revert() {},
  })

  try {
    const cleanup = playEntrance({})

    assert.equal(starts, 0)
    assert.equal(typeof listeners.get('visibilitychange'), 'function')

    visibilityState = 'visible'
    listeners.get('visibilitychange')()

    assert.equal(starts, 1)
    assert.equal(listeners.has('visibilitychange'), false)
    cleanup?.()
  } finally {
    gsap.matchMedia = originalMatchMedia
    globalThis.document = originalDocument
  }
})
