// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Price API Endpoint
//  Vercel Serverless Function: /api/token-price
//  GET ?token=btc|opn → price data
// ═══════════════════════════════════════════════════════════════

// Simple cache
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 15000; // 15 seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = (req.query.token || 'all').toLowerCase();

  try {
    // Use cache if fresh
    if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
      return res.status(200).json(_filterByToken(_cache, token));
    }

    // Fetch BTC from CoinGecko
    const [btcData, opnData] = await Promise.allSettled([
      fetchBTC(),
      fetchOPN(),
    ]);

    const result = {
      btc: btcData.status === 'fulfilled' ? btcData.value : { price: 0, change24h: 0 },
      opn: opnData.status === 'fulfilled' ? opnData.value : { price: 0, change24h: 0 },
      updatedAt: new Date().toISOString(),
    };

    _cache = result;
    _cacheTime = Date.now();

    return res.status(200).json(_filterByToken(result, token));

  } catch (err) {
    console.error('[Price API]', err);
    return res.status(500).json({ error: 'Price fetch failed' });
  }
}

function _filterByToken(data, token) {
  if (token === 'btc') return { btc: data.btc, updatedAt: data.updatedAt };
  if (token === 'opn') return { opn: data.opn, updatedAt: data.updatedAt };
  return data;
}

async function fetchBTC() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error('CoinGecko error');
  const json = await res.json();
  const b = json.bitcoin;
  return {
    price: b.usd,
    change24h: b.usd_24h_change,
    volume24h: b.usd_24h_vol,
    marketCap: b.usd_market_cap,
  };
}

async function fetchOPN() {
  const res = await fetch(
    'https://api.dexscreener.com/latest/dex/search/?q=OPN',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error('DexScreener error');
  const json = await res.json();
  const pairs = json?.pairs || [];
  const pair = pairs.find(p =>
    p.baseToken?.symbol?.toUpperCase() === 'OPN' ||
    p.quoteToken?.symbol?.toUpperCase() === 'OPN'
  );
  if (!pair) return { price: 0, change24h: 0, volume24h: 0, liquidity: 0 };
  return {
    price: parseFloat(pair.priceUsd || 0),
    change24h: parseFloat(pair.priceChange?.h24 || 0),
    volume24h: parseFloat(pair.volume?.h24 || 0),
    liquidity: parseFloat(pair.liquidity?.usd || 0),
    marketCap: parseFloat(pair.fdv || 0),
  };
}
