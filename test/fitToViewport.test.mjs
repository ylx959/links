import assert from 'node:assert/strict'
import test from 'node:test'
import { fitZoom } from '../src/fitToViewport.ts'

test('content that fits keeps its size', () => {
  assert.equal(fitZoom(585, 800), 1)
  assert.equal(fitZoom(585, 585), 1)
})

test('content taller than the room shrinks to fit exactly', () => {
  assert.equal(fitZoom(585, 292.5), 0.5)
})

test('unmeasured or empty sizes never zoom', () => {
  assert.equal(fitZoom(0, 400), 1)
  assert.equal(fitZoom(585, 0), 1)
  assert.equal(fitZoom(585, -20), 1)
})
