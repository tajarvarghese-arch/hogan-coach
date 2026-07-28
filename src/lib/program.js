// The 9-week lifting program as code: who lifts what, when.
// Mirrors the Google Calendar seed exactly — Mon/Tue/Thu/Fri sessions,
// A/B parity flipping weekly after the Hawaii habit-keeper week,
// test day Fri Sep 25. Bench weight comes from the user's log via
// computeNextBench; the calendar's ideal path is only the fallback.

import { computeNextBench, normLifts } from './sync.js'

export const PROGRAM_START = '2026-07-27'
const HAWAII_MON = '2026-08-03'
const TEST_ISO = '2026-09-25'
const PROGRAM_END = '2026-10-02'

const isoOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayMs = 86400000

/* Monday of the week containing iso (local) */
function mondayOf(d) {
  const dow = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow)
}

/* next RDL weight per the program: +5 through 135, then +2.5 */
export function nextRDL(lifts) {
  const entries = Object.values(normLifts(lifts)).filter((e) => typeof e.rdl === 'number')
  if (!entries.length) return 95
  const last = Math.max(...entries.map((e) => e.rdl))
  return last < 135 ? last + 5 : Math.round((last + 2.5) * 2) / 2
}

/* session kind for a given local date: 'A' | 'B' | 'HK' | 'TEST' | null */
export function sessionKind(d) {
  const iso = isoOf(d)
  if (iso < PROGRAM_START || iso > PROGRAM_END) return null
  const mon = isoOf(mondayOf(d))
  const dow = (d.getDay() + 6) % 7 // Mon=0
  if (mon === HAWAII_MON) return dow === 0 || dow === 3 || dow === 5 ? 'HK' : null
  if (iso === TEST_ISO) return 'TEST'
  if (![0, 1, 3, 4].includes(dow)) return null
  const weeksSince = Math.round((mondayOf(d) - mondayOf(new Date(2026, 6, 27))) / (7 * dayMs))
  /* week 1 opens with B (user's call — ease in with pullups, bench
     lands Tuesday); A holds Mon/Thu only on odd weeks after Hawaii */
  const aOnMon = weeksSince % 2 === 1
  const isA = aOnMon ? dow === 0 || dow === 3 : dow === 1 || dow === 4
  return isA ? 'A' : 'B'
}

/* The menu: what the next session is, from `now` (skipping today's
   session if it is already logged). */
export function nextLiftSession(now, lifts, todayLogged = false) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 0; i <= 9; i++) {
    const d = new Date(today.getTime() + i * dayMs)
    const kind = sessionKind(d)
    if (!kind) continue
    if (i === 0 && todayLogged) continue
    const iso = isoOf(d)
    const when = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' :
      d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() + ' ' +
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
    if (kind === 'A') {
      const w = computeNextBench(lifts) ?? 135
      const r = nextRDL(lifts)
      const warm = Math.round((w * 0.8) / 5) * 5
      return {
        iso, when, kind, bench: w, rdl: r,
        headline: `A — BENCH ${w} 3×5 + RDL ${r}`,
        steps: [
          `RAMP: BAR 45 ×5 · 95 ×5 · ${warm} ×3 (short rests)`,
          `BENCH ${w} — 3 sets of 5 · rest 90s · leave 1 in the tank`,
          `RDL ${r} — 2 sets of 8 · rest 60s`,
        ],
      }
    }
    if (kind === 'B') return {
      iso, when, kind,
      headline: 'B — PULLUPS + SWINGS',
      steps: [
        'LADDER: 1 pullup · rest · 1 · rest · 2 — run it twice, never to failure',
        'SWINGS 3×10 or HIP THRUSTS 2×10 — crisp and snappy',
        'FINISHER: 1 slow negative, 5 seconds down',
      ],
    }
    if (kind === 'HK') return {
      iso, when, kind,
      headline: 'HABIT KEEPER (VACATION)',
      steps: [
        'LADDER 1 · 1 · 2 on anything you can hang from',
        '20 hip thrusts or a steep walk — 5-10 min total',
        'Any attempt counts as done',
      ],
    }
    if (kind === 'TEST') {
      const w = computeNextBench(lifts) ?? 170
      return {
        iso, when, kind, bench: w,
        headline: `TEST DAY ⚑ — AMRAP @ ${w}`,
        steps: [
          `RAMP: 45 ×5 · 95 ×5 · 135 ×3 · ${Math.round((w * 0.9) / 5) * 5} ×1`,
          `ONE all-out set @ ${w} — stop when form breaks, not at failure`,
          'THEN: max strict pullups, one set — log both numbers',
        ],
      }
    }
  }
  return null
}
