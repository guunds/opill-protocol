// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Transaction API
//  Storage: Vercel KV (Redis) — free tier, no config needed on Vercel
//  Endpoints:
//    POST /api/transactions        → save a transaction
//    GET  /api/transactions?wallet_address=xxx → get user transactions
//    DELETE /api/transactions?wallet_address=xxx → clear user transactions
// ═══════════════════════════════════════════════════════════════

const MAX_TX_PER_WALLET = 500; // keep last 500 tx per user
const TX_TTL_SECONDS    = 60 * 60 * 24 * 365; // 1 year

// ── CORS helper ──────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── KV storage adapter (Vercel KV / Upstash Redis) ───────────
async function kvGet(key) {
  // Vercel KV auto-injects: KV_REST_API_URL, KV_REST_API_TOKEN
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return null;
  const d = await r.json();
  return d.result ?? null;
}

async function kvSet(key, value, ttl = TX_TTL_SECONDS) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;

  const r = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${ttl}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.ok;
}

async function kvDel(key) {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;

  const r = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.ok;
}

// ── Normalize wallet address (lowercase, trim) ────────────────
function normalizeAddr(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const clean = addr.trim().toLowerCase();
  // Basic Bitcoin address validation (testnet4 + mainnet)
  if (!/^(tb1|bc1|[13mn2])[a-z0-9]{6,}/i.test(clean) && clean.length < 10) return null;
  return clean;
}

// ── Main handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  cors(res);

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { wallet_address } = req.query;

  // ── GET /api/transactions?wallet_address=xxx ──────────────
  if (req.method === 'GET') {
    const addr = normalizeAddr(wallet_address);
    if (!addr) return res.status(400).json({ error: 'Missing or invalid wallet_address' });

    const kvKey = `txlog:${addr}`;
    try {
      const raw = await kvGet(kvKey);
      const txs = raw ? JSON.parse(raw) : [];
      return res.status(200).json({
        wallet_address: addr,
        count: txs.length,
        transactions: txs
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch transactions', detail: e.message });
    }
  }

  // ── POST /api/transactions ─────────────────────────────────
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
    }

    const addr = normalizeAddr(body?.wallet_address);
    if (!addr) return res.status(400).json({ error: 'Missing wallet_address' });

    const tx = {
      id:          body.id     || `tx_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      type:        body.type   || 'unknown',
      label:       String(body.label  || '').slice(0, 120),
      amount:      body.amount || 0,
      unit:        String(body.unit   || 'OPN').slice(0, 10),
      status:      body.status || 'confirmed',
      txid:        body.txid   || null,
      ts:          body.ts     || Date.now(),
      saved_at:    Date.now()
    };

    const kvKey = `txlog:${addr}`;
    try {
      const raw  = await kvGet(kvKey);
      const txs  = raw ? JSON.parse(raw) : [];

      // Deduplicate by id
      const exists = txs.some(t => t.id === tx.id);
      if (!exists) {
        txs.unshift(tx); // newest first
        // Trim to max
        const trimmed = txs.slice(0, MAX_TX_PER_WALLET);
        await kvSet(kvKey, JSON.stringify(trimmed));
      }

      return res.status(200).json({ ok: true, tx, total: txs.length });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to save transaction', detail: e.message });
    }
  }

  // ── DELETE /api/transactions?wallet_address=xxx ───────────
  if (req.method === 'DELETE') {
    const addr = normalizeAddr(wallet_address);
    if (!addr) return res.status(400).json({ error: 'Missing wallet_address' });
    await kvDel(`txlog:${addr}`);
    return res.status(200).json({ ok: true, message: 'Transaction history cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
