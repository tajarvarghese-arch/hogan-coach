// Vercel serverless function — live quote proxy.
// Proxies Yahoo Finance (no API key) so the browser can pull real prices
// without CORS issues. GET /api/quote?symbols=AAPL,GOOG,UNH
//
// Returns: { quotes: { AAPL: { price, prevClose }, ... } }

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0 Safari/537.36'

/* thin a series to at most n points, keeping first and last */
export function downsample(arr, n = 24) {
  const clean = (arr || []).filter((v) => typeof v === 'number' && Number.isFinite(v))
  if (clean.length <= n) return clean
  const out = []
  for (let i = 0; i < n; i++) out.push(clean[Math.round((i / (n - 1)) * (clean.length - 1))])
  return out
}

async function fetchOne(symbol) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=5m&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`yahoo ${res.status}`)
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  const meta = result?.meta
  if (!meta) throw new Error('no meta')
  const price =
    typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0
      ? meta.regularMarketPrice
      : null
  const prevClose =
    typeof meta.chartPreviousClose === 'number'
      ? meta.chartPreviousClose
      : typeof meta.previousClose === 'number'
        ? meta.previousClose
        : null
  const spark = downsample(result?.indicators?.quote?.[0]?.close, 24)
  const asOf = typeof meta.regularMarketTime === 'number' ? meta.regularMarketTime * 1000 : 0
  return { price, prevClose, asOf, ...(spark.length >= 2 ? { spark } : {}) }
}

/* Yahoo's keyless chart feed sometimes stalls mid-session (observed
   2026-07-24: every surface pinned to the same trade for 30+ min).
   When a quote looks stale during trading hours, Cboe's free delayed
   feed takes over for price/prevClose; the Yahoo spark is kept. */

/* rough NYSE session envelope in UTC — wide on purpose: it only
   gates the extra Cboe call, never the display */
export function probablyTrading(nowMs) {
  const d = new Date(nowMs)
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 6) return false
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes()
  return mins >= 13 * 60 && mins <= 21 * 60 + 30
}

export function isStale(asOfMs, nowMs) {
  return !asOfMs || nowMs - asOfMs > 180_000
}

export function parseCboe(json) {
  const d = json?.data
  /* delisted/dead symbols come back as an all-zeros record (seen with
     FI after the FISV rename) — a non-positive price is never real */
  if (!d || typeof d.current_price !== 'number' || !(d.current_price > 0)) return null
  return {
    price: d.current_price,
    prevClose: typeof d.prev_day_close === 'number' ? d.prev_day_close : null,
    asOf: Date.parse(`${(json.timestamp || '').replace(' ', 'T')}Z`) || 0,
  }
}

async function fetchCboe(symbol) {
  const url = `https://cdn.cboe.com/api/global/delayed_quotes/quotes/${encodeURIComponent(symbol)}.json`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`cboe ${res.status}`)
  return parseCboe(await res.json())
}

export default async function handler(req, res) {
  const raw = (req.query?.symbols || '').toString()
  const symbols = raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 40)

  if (!symbols.length) {
    res.status(400).json({ error: 'symbols required' })
    return
  }

  const quotes = {}
  const now = Date.now()
  await Promise.all(
    symbols.map(async (sym) => {
      let q = null
      try {
        q = await fetchOne(sym)
      } catch {
        // fall through to Cboe
      }
      if (probablyTrading(now) && (!q || isStale(q.asOf, now))) {
        try {
          const c = await fetchCboe(sym)
          if (c && (!q || c.asOf > q.asOf)) {
            q = { ...(q || {}), price: c.price, prevClose: c.prevClose ?? q?.prevClose ?? null, asOf: c.asOf, src: 'cboe' }
          }
        } catch {
          // keep whatever Yahoo gave us
        }
      }
      if (q) quotes[sym] = q
      // symbols that failed both sources are omitted; client keeps its last-known value
    })
  )

  // cache at the edge for 10s to stay well under Yahoo rate limits
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30')
  res.status(200).json({ quotes, ts: Date.now() })
}
