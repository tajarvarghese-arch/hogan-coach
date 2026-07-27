import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextLiftSession, nextRDL, sessionKind } from '../src/lib/program.js'

const d = (y, m, day) => new Date(y, m - 1, day)

test('sessionKind mirrors the seeded calendar', () => {
  assert.equal(sessionKind(d(2026, 7, 26)), null, 'Sunday before start')
  assert.equal(sessionKind(d(2026, 7, 27)), 'B', 'wk1 Mon B (week one opens easy)')
  assert.equal(sessionKind(d(2026, 7, 28)), 'A', 'wk1 Tue A')
  assert.equal(sessionKind(d(2026, 7, 29)), null, 'Wednesdays rest')
  assert.equal(sessionKind(d(2026, 7, 31)), 'A', 'wk1 Fri A')
  assert.equal(sessionKind(d(2026, 8, 3)), 'HK', 'Hawaii Mon')
  assert.equal(sessionKind(d(2026, 8, 5)), null, 'Hawaii Wed off (helicopter)')
  assert.equal(sessionKind(d(2026, 8, 8)), 'HK', 'Hawaii Sat')
  assert.equal(sessionKind(d(2026, 8, 10)), 'B', 'post-trip Mon is B')
  assert.equal(sessionKind(d(2026, 8, 11)), 'A', 'post-trip Tue is A')
  assert.equal(sessionKind(d(2026, 8, 17)), 'A', 'wk3 Mon A again')
  assert.equal(sessionKind(d(2026, 9, 22)), 'A', 'test week Tue A')
  assert.equal(sessionKind(d(2026, 9, 25)), 'TEST', 'test day')
  assert.equal(sessionKind(d(2026, 9, 28)), 'A', 'wk9 Mon A')
  assert.equal(sessionKind(d(2026, 10, 5)), null, 'after program end')
})

test('nextLiftSession: before the program points at day one (B)', () => {
  const s = nextLiftSession(d(2026, 7, 26), {})
  assert.equal(s.iso, '2026-07-27')
  assert.equal(s.when, 'TOMORROW')
  assert.equal(s.headline, 'B — PULLUPS + SWINGS')
})

test('nextLiftSession: logged today advances to the next session', () => {
  const lifts = { '2026-07-27': { w: 0, reps: [], rdl: null, mt: 1 } }
  const s = nextLiftSession(d(2026, 7, 27), lifts, true)
  assert.equal(s.iso, '2026-07-28')
  assert.equal(s.kind, 'A')
})

test('nextLiftSession: A-session weight follows the log rules', () => {
  const lifts = { '2026-07-28': { w: 135, reps: [5, 5, 5], rdl: 95, mt: 1 } }
  const s = nextLiftSession(d(2026, 7, 31), lifts)
  assert.equal(s.iso, '2026-07-31')
  assert.equal(s.kind, 'A')
  assert.ok(s.headline.includes('BENCH 137.5'), s.headline)
  assert.ok(s.headline.includes('RDL 100'), s.headline)
})

test('nextRDL climbs +5 through 135 then +2.5', () => {
  assert.equal(nextRDL({}), 95)
  assert.equal(nextRDL({ a: { w: 1, reps: [], rdl: 130, mt: 1 } }), 135)
  assert.equal(nextRDL({ a: { w: 1, reps: [], rdl: 135, mt: 1 } }), 137.5)
})
