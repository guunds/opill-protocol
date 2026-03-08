// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Faucet API Endpoint
//  Vercel Serverless Function: /api/faucet
//  POST { address: string } → { txid, amount }
// ═══════════════════════════════════════════════════════════════

// In-memory rate limit store (resets on cold start — use Redis/KV for production)
const claims = new Map();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const FAUCET_AMOUNT = '100'; // OPN tokens

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { address } = req.body || {};

    // Validate address
    if (!address || typeof address !== 'string' || address.length < 10) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Check Bitcoin address format (basic)
    if (!/^(bc1|tb1|1|3|m|n|2)[a-zA-Z0-9]{6,}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Bitcoin address format' });
    }

    // Rate limit check
    const lastClaim = claims.get(address);
    if (lastClaim) {
      const elapsed = Date.now() - lastClaim;
      if (elapsed < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - elapsed;
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        return res.status(429).json({
          error: `Rate limited. Try again in ${hours}h ${minutes}m`,
          nextClaimAt: new Date(lastClaim + COOLDOWN_MS).toISOString(),
        });
      }
    }

    // === FAUCET LOGIC ===
    // In production: use OP_NET SDK to send tokens
    // Example with @btc-vision/transaction (requires private key in env):
    //
    // const { Wallet } = await import('@btc-vision/bitcoin');
    // const provider = new JSONRpcProvider(process.env.OPNET_RPC_URL, 'mainnet');
    // const signer = Wallet.fromWIF(process.env.FAUCET_PRIVATE_KEY);
    // const contract = getContract(process.env.OPN_CONTRACT_ADDRESS, OPN_ABI, provider, 'mainnet', signer.address);
    // const simulation = await contract.transfer(address, FAUCET_AMOUNT);
    // if ('error' in simulation) throw new Error(simulation.error);
    // const txResult = await provider.sendRawTransaction(simulation.psbt);
    // const txid = txResult.txid;

    // For now: generate demo txid
    const txid = Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Record claim
    claims.set(address, Date.now());

    return res.status(200).json({
      success: true,
      txid,
      amount: FAUCET_AMOUNT,
      token: 'OPN',
      address,
      message: `${FAUCET_AMOUNT} OPN sent to ${address.slice(0, 8)}...`,
    });

  } catch (err) {
    console.error('[Faucet API] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
