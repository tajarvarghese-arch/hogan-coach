import { test } from 'node:test'
import assert from 'node:assert/strict'
import { downsample, isStale, parseCboe, probablyTrading } from '../api/quote.js'

test('downsample keeps short series intact', () => {
  assert.deepEqual(downsample([1, 2, 3], 24), [1, 2, 3])
})

test('downsample thins long series, preserving endpoints', () => {
  const long = Array.from({ length: 78 }, (_, i) => i)
  const d = downsample(long, 24)
  assert.equal(d.length, 24)
  assert.equal(d[0], 0)
  assert.equal(d[23], 77)
})

test('downsample drops nulls and non-numbers', () => {
  assert.deepEqual(downsample([1, null, 2, NaN, 3, undefined], 24), [1, 2, 3])
})

test('downsample tolerates empty/absent input', () => {
  assert.deepEqual(downsample(null, 24), [])
  assert.deepEqual(downsample([], 24), [])
})

test('isStale flags quotes older than 3 minutes or missing', () => {
  const now = 1785000000000
  assert.equal(isStale(now - 60000, now), false)
  assert.equal(isStale(now - 200000, now), true)
  assert.equal(isStale(0, now), true)
  assert.equal(isStale(undefined, now), true)
})

test('probablyTrading covers weekday NYSE hours in UTC, rejects weekends', () => {
  assert.equal(probablyTrading(Date.UTC(2026, 6, 24, 15, 0)), true)  // Fri 11:00 ET
  assert.equal(probablyTrading(Date.UTC(2026, 6, 24, 3, 0)), false)  // Fri overnight
  assert.equal(probablyTrading(Date.UTC(2026, 6, 25, 15, 0)), false) // Saturday
  assert.equal(probablyTrading(Date.UTC(2026, 6, 26, 15, 0)), false) // Sunday
})

test('parseCboe maps the delayed-quote shape and UTC timestamp', () => {
  const q = parseCboe({ timestamp: '2026-07-24 15:04:35', data: { current_price: 329.27, prev_day_close: 321.66 } })
  assert.equal(q.price, 329.27)
  assert.equal(q.prevClose, 321.66)
  assert.equal(q.asOf, Date.UTC(2026, 6, 24, 15, 4, 35))
  assert.equal(parseCboe({ data: {} }), null)
  assert.equal(parseCboe(null), null)
})
