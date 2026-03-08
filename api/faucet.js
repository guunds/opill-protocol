// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Faucet API
//  POST /api/faucet  { address, token?, amount? }
//  Rate limit: 24h per address — stored in Vercel KV (persistent)
//  Falls back to in-memory if KV not configured
// ═══════════════════════════════════════════════════════════════

const COOLDOWN_MS    = 24 * 60 * 60 * 1000;
const FAUCET_AMOUNTS = { OPN: '100', tBTC: '0.1', tUSDT: '1000' };

// In-memory fallback (resets on cold start)
const _memClaims = new Map();

// ── KV helpers ──────────────────────────────────────────────
async function kvGet(key) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.result ?? null;
  } catch(_) { return null; }
}

async function kvSet(key, value, ttlSeconds) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  try {
    const r = await fetch(
      `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(String(value))}?ex=${ttlSeconds}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    return r.ok;
  } catch(_) { return false; }
}

// ── Save TX to user history in KV ───────────────────────────
async function saveTxToKV(address, txData) {
  try {
    const key = 'txlog:' + address;
    const raw = await kvGet(key);
    const txs = raw ? JSON.parse(raw) : [];
    txs.unshift(txData);
    await kvSet(key, JSON.stringify(txs.slice(0, 500)), 60 * 60 * 24 * 365);
  } catch(_) {}
}

// ── Rate limit check ─────────────────────────────────────────
async function checkRateLimit(address) {
  // Try KV (persistent across restarts)
  const kvVal = await kvGet('faucet_claim:' + address);
  if (kvVal) {
    const last = parseInt(kvVal);
    const elapsed = Date.now() - last;
    if (elapsed < COOLDOWN_MS) {
      const rem = COOLDOWN_MS - elapsed;
      const h = Math.floor(rem / 3600000), m = Math.floor((rem % 3600000) / 60000);
      return { limited: true, message: `Rate limited. Try again in ${h}h ${m}m.` };
    }
  }
  // Fallback: in-memory
  const memLast = _memClaims.get(address);
  if (memLast && (Date.now() - memLast) < COOLDOWN_MS) {
    const rem = COOLDOWN_MS - (Date.now() - memLast);
    const h = Math.floor(rem / 3600000), m = Math.floor((rem % 3600000) / 60000);
    return { limited: true, message: `Rate limited. Try again in ${h}h ${m}m.` };
  }
  return { limited: false };
}

async function recordClaim(address) {
  const now = Date.now();
  await kvSet('faucet_claim:' + address, String(now), Math.ceil(COOLDOWN_MS / 1000) + 600);
  _memClaims.set(address, now);
}

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch(_) {} }

    const { address, token = 'OPN' } = body || {};
    if (!address || typeof address !== 'string' || address.length < 10) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    if (!/^(bc1|tb1|1|3|m|n|2)[a-zA-Z0-9]{6,}$/i.test(address.trim())) {
      return res.status(400).json({ error: 'Invalid Bitcoin address format' });
    }

    const addr          = address.trim().toLowerCase();
    const selectedToken = FAUCET_AMOUNTS[token] ? token : 'OPN';
    const amount        = FAUCET_AMOUNTS[selectedToken];

    // Check rate limit
    const rateCheck = await checkRateLimit(addr);
    if (rateCheck.limited) return res.status(429).json({ error: rateCheck.message });

    // Simulate TX
    const txid = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Record claim + save TX to history
    await recordClaim(addr);
    await saveTxToKV(addr, {
      id: 'faucet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: 'faucet', action: 'faucet',
      label: `Faucet: ${amount} ${selectedToken}`,
      amount: parseFloat(amount), token: selectedToken, unit: selectedToken,
      tx_hash: txid, txid, wallet_address: addr,
      timestamp: Date.now(), ts: Date.now(), status: 'confirmed'
    });

    return res.status(200).json({
      success: true, txid, amount, token: selectedToken, address: addr,
      message: `${amount} ${selectedToken} sent successfully`,
      next_claim_in_hours: 24
    });

  } catch (err) {
    console.error('[faucet]', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
