// Vercel serverless function — daily book pull, no desktop required.
// Calls IBKR's Flex Web Service (token-based REST, no gateway session)
// for end-of-day open positions + net liquidation, and stores the book
// in Redis for /api/book. Triggered by Vercel Cron each morning, or
// manually with the sync key.
//
// Env: IBKR_FLEX_TOKEN, IBKR_FLEX_QUERY_ID (user creates both in IBKR
// Account Management), plus the existing KV/SYNC vars. Optional
// CRON_SECRET — Vercel sends it as a Bearer token on cron invocations.

const KEY = 'tajar-book'
const FLEX = 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService'

export const config = { maxDuration: 60 }

const attr = (s, k) => new RegExp(`\\b${k}="([^"]*)"`).exec(s)?.[1]

/* Parse a Flex Activity statement: open positions (summary rows, lots
   aggregated defensively) and the account's total NAV. EOD mark price
   doubles as both `last` and `prevClose` — live quotes take over the
   `last` intraday. */
export function parseFlex(xml) {
  const rows = new Map()
  const tagRe = /<OpenPosition\b([^>]*?)\/?>(?:<\/OpenPosition>)?/g
  let m
  while ((m = tagRe.exec(xml))) {
    const a = m[1]
    if ((attr(a, 'levelOfDetail') || '').toUpperCase() === 'LOT') continue
    const cat = attr(a, 'assetCategory')
    if (cat && cat !== 'STK') continue
    const sym = (attr(a, 'symbol') || '').trim().toUpperCase()
    const qty = parseFloat(attr(a, 'position'))
    const mark = parseFloat(attr(a, 'markPrice'))
    const avg = parseFloat(attr(a, 'costBasisPrice'))
    if (!sym || !Number.isFinite(qty) || qty === 0 || !(mark > 0)) continue
    const prev = rows.get(sym)
    if (prev) {
      /* two rows for one symbol (long+short lots): net them */
      const totQty = prev.qty + qty
      const totCost = prev.avg * prev.qty + (Number.isFinite(avg) ? avg : mark) * qty
      rows.set(sym, { ...prev, qty: totQty, avg: totQty !== 0 ? totCost / totQty : prev.avg })
    } else {
      rows.set(sym, {
        sym,
        name: (attr(a, 'description') || sym).toUpperCase().slice(0, 24),
        yh: sym,
        qty,
        avg: Number.isFinite(avg) ? avg : mark,
        last: mark,
        prevClose: mark,
      })
    }
  }
  let netLiq = null
  const nav =
    /<EquitySummaryByReportDateInBase\b[^>]*\btotal="(-?[\d.]+)"/g
  let nm
  while ((nm = nav.exec(xml))) netLiq = parseFloat(nm[1])
  if (netLiq == null) {
    const alt = /<NetAssetValue\b[^>]*\btotal(?:Long)?="(-?[\d.]+)"/.exec(xml)
    if (alt) netLiq = parseFloat(alt[1])
  }
  return { rows: [...rows.values()].filter((r) => r.qty !== 0), netLiq }
}

async function redis(cmdPath, body) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  const r = await fetch(`${url}/${cmdPath}`, {
    method: body != null ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}` },
    ...(body != null ? { body } : {}),
  })
  if (!r.ok) throw new Error('store unavailable')
  return r.json()
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default async function handler(req, res) {
  const cronOK =
    process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  const keyOK = process.env.SYNC_SECRET && req.headers['x-sync-key'] === process.env.SYNC_SECRET
  /* Vercel Cron without CRON_SECRET set sends no auth header but always
     sets x-vercel-cron — accept that too so setup stays one-step */
  const vercelCron = !!req.headers['x-vercel-cron']
  if (!cronOK && !keyOK && !vercelCron) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const t = process.env.IBKR_FLEX_TOKEN
  const q = process.env.IBKR_FLEX_QUERY_ID
  if (!t || !q) {
    res.status(503).json({ error: 'flex not configured — set IBKR_FLEX_TOKEN and IBKR_FLEX_QUERY_ID' })
    return
  }

  try {
    const send = await (await fetch(`${FLEX}.SendRequest?t=${t}&q=${q}&v=3`)).text()
    const ref = /<ReferenceCode>(\d+)<\/ReferenceCode>/.exec(send)?.[1]
    if (!ref) {
      res.status(502).json({ error: 'flex SendRequest failed', detail: send.slice(0, 300) })
      return
    }
    let xml = ''
    for (let i = 0; i < 10; i++) {
      await sleep(i === 0 ? 1500 : 2500)
      xml = await (await fetch(`${FLEX}.GetStatement?t=${t}&q=${ref}&v=3`)).text()
      if (xml.includes('<FlexQueryResponse')) break
    }
    if (!xml.includes('<FlexQueryResponse')) {
      res.status(504).json({ error: 'flex statement not ready', detail: xml.slice(0, 300) })
      return
    }
    const { rows, netLiq } = parseFlex(xml)
    if (!rows.length) {
      res.status(502).json({ error: 'flex returned no positions', detail: xml.slice(0, 300) })
      return
    }
    const book = { rows, netLiq, asOf: Date.now() }
    await redis(`set/${KEY}`, JSON.stringify(book))
    res.status(200).json({ ok: true, positions: rows.length, netLiq, asOf: book.asOf })
  } catch (e) {
    res.status(502).json({ error: 'flex refresh failed', detail: String(e).slice(0, 200) })
  }
}
