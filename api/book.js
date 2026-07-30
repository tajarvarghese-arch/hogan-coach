// Vercel serverless function — serves the stored book (positions +
// net liq) that /api/book-refresh pulls from IBKR Flex each morning.
// Sync-key gated: the book is real money; keyless devices fall back
// to the compiled seeds.

const KEY = 'tajar-book'

export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  const secret = process.env.SYNC_SECRET
  if (!url || !token || !secret) {
    res.status(503).json({ error: 'not configured' })
    return
  }
  if (req.headers['x-sync-key'] !== secret) {
    res.status(401).json({ error: 'bad sync key' })
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const r = await fetch(`${url}/get/${KEY}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) {
    res.status(502).json({ error: 'store unavailable' })
    return
  }
  const { result } = await r.json()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json(result ? JSON.parse(result) : { rows: null })
}
