// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — User Profile API
//  Stores: points, completed tasks, leaderboard rank
//  GET  /api/user?wallet_address=xxx
//  POST /api/user  { wallet_address, points, tasks_done, breakdown }
// ═══════════════════════════════════════════════════════════════

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.result ?? null;
}

async function kvSet(key, value, ttl = 60*60*24*365) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const r = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${ttl}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }
  });
  return r.ok;
}

function normalizeAddr(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const clean = addr.trim().toLowerCase();
  return clean.length >= 10 ? clean : null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { wallet_address } = req.query;

  if (req.method === 'GET') {
    const addr = normalizeAddr(wallet_address);
    if (!addr) return res.status(400).json({ error: 'Missing wallet_address' });
    try {
      const raw = await kvGet(`user:${addr}`);
      const user = raw ? JSON.parse(raw) : { points: 0, tasks_done: [], breakdown: {}, first_seen: Date.now() };
      return res.status(200).json({ wallet_address: addr, ...user });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error:'Invalid JSON'}); } }
    const addr = normalizeAddr(body?.wallet_address);
    if (!addr) return res.status(400).json({ error: 'Missing wallet_address' });
    try {
      const raw = await kvGet(`user:${addr}`);
      const existing = raw ? JSON.parse(raw) : { first_seen: Date.now() };
      const updated = {
        ...existing,
        points:     body.points     ?? existing.points     ?? 0,
        tasks_done: body.tasks_done ?? existing.tasks_done ?? [],
        breakdown:  body.breakdown  ?? existing.breakdown  ?? {},
        last_seen:  Date.now()
      };
      await kvSet(`user:${addr}`, JSON.stringify(updated));
      return res.status(200).json({ ok: true, ...updated });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
