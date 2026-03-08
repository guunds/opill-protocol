// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Real-Time Price Module
//  Sources: DexScreener API (primary), CoinGecko (BTC fallback)
//  Auto-updates every 20 seconds
// ═══════════════════════════════════════════════════════════════

'use strict';

const PriceModule = (() => {

  // ── Config ──
  const CONFIG = {
    updateInterval: 20000, // 20 seconds
    // DexScreener pair address for OPN token (update with real address when live)
    dexscreenerPair: 'BTC_OPN_PAIR_ADDRESS',
    // CoinGecko IDs
    btcCoinGeckoId: 'bitcoin',
    // Fallback static prices for demo
    useFallback: false,
  };

  // ── Current price data ──
  const data = {
    btc: { price: 0, change24h: 0, volume24h: 0, marketCap: 0 },
    opn: { price: 0, change24h: 0, volume24h: 0, marketCap: 0, liquidity: 0 },
    lastUpdated: null,
  };

  let _timer = null;
  const _listeners = [];

  // ── Fetch BTC price from CoinGecko ──
  async function fetchBTCPrice() {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const btc = json.bitcoin;
      data.btc = {
        price: btc.usd || 0,
        change24h: btc.usd_24h_change || 0,
        volume24h: btc.usd_24h_vol || 0,
        marketCap: btc.usd_market_cap || 0,
      };
      return data.btc;
    } catch (e) {
      console.warn('[Price] BTC fetch failed:', e.message);
      // Try alternative
      return fetchBTCFallback();
    }
  }

  // ── BTC price fallback via alternative API ──
  async function fetchBTCFallback() {
    try {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
        signal: AbortSignal.timeout(5000)
      });
      const json = await res.json();
      const price = parseFloat(json?.data?.amount || 0);
      data.btc.price = price;
      return data.btc;
    } catch (e) {
      console.warn('[Price] BTC fallback failed:', e.message);
      return data.btc;
    }
  }

  // ── Fetch OPN price from DexScreener ──
  async function fetchOPNPrice() {
    try {
      // DexScreener search for OPN token
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/search/?q=OPN`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const pairs = json?.pairs;
      if (!pairs || pairs.length === 0) throw new Error('No pairs found');

      // Find most relevant OPN pair
      const opnPair = pairs.find(p =>
        (p.baseToken?.symbol?.toUpperCase() === 'OPN' ||
         p.quoteToken?.symbol?.toUpperCase() === 'OPN') &&
        parseFloat(p.liquidity?.usd || 0) > 1000
      ) || pairs[0];

      const isBase = opnPair.baseToken?.symbol?.toUpperCase() === 'OPN';
      const price = parseFloat(opnPair.priceUsd || 0);
      const change24h = parseFloat(opnPair.priceChange?.h24 || 0);
      const volume24h = parseFloat(opnPair.volume?.h24 || 0);
      const liquidity = parseFloat(opnPair.liquidity?.usd || 0);
      const fdv = parseFloat(opnPair.fdv || 0);

      data.opn = { price, change24h, volume24h, marketCap: fdv, liquidity };
      return data.opn;
    } catch (e) {
      console.warn('[Price] OPN DexScreener failed:', e.message);
      return data.opn;
    }
  }

  // ── Fetch all prices ──
  async function fetchAll() {
    await Promise.allSettled([fetchBTCPrice(), fetchOPNPrice()]);
    data.lastUpdated = new Date();
    _notifyListeners();
    return data;
  }

  // ── Notify all listeners ──
  function _notifyListeners() {
    _listeners.forEach(fn => { try { fn({ ...data }); } catch (_) {} });
  }

  // ── Subscribe to price updates ──
  function subscribe(fn) {
    _listeners.push(fn);
    // Immediately call with current data if available
    if (data.lastUpdated) { try { fn({ ...data }); } catch (_) {} }
    return () => {
      const idx = _listeners.indexOf(fn);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  // ── Start auto-update ──
  function start() {
    if (_timer) return;
    fetchAll(); // immediate first fetch
    _timer = setInterval(fetchAll, CONFIG.updateInterval);
  }

  // ── Stop auto-update ──
  function stop() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }

  // ── Formatters ──
  function formatPrice(n) {
    if (!n || n === 0) return '$0.00';
    if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + n.toFixed(6);
  }

  function formatLarge(n) {
    if (!n || n === 0) return '$0';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
    return '$' + n.toFixed(2);
  }

  function formatChange(n) {
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(2)}%`;
  }

  function changeColor(n) {
    return n >= 0 ? 'var(--green)' : 'var(--red)';
  }

  // ── Update DOM elements by data-price attribute ──
  function bindDOM() {
    subscribe((d) => {
      // BTC price elements
      document.querySelectorAll('[data-price="btc"]').forEach(el => {
        el.textContent = formatPrice(d.btc.price);
      });
      document.querySelectorAll('[data-price-change="btc"]').forEach(el => {
        el.textContent = formatChange(d.btc.change24h);
        el.style.color = changeColor(d.btc.change24h);
      });
      // OPN price elements
      document.querySelectorAll('[data-price="opn"]').forEach(el => {
        el.textContent = formatPrice(d.opn.price);
      });
      document.querySelectorAll('[data-price-change="opn"]').forEach(el => {
        el.textContent = formatChange(d.opn.change24h);
        el.style.color = changeColor(d.opn.change24h);
      });
      document.querySelectorAll('[data-price-volume="opn"]').forEach(el => {
        el.textContent = formatLarge(d.opn.volume24h);
      });
      document.querySelectorAll('[data-price-mcap="opn"]').forEach(el => {
        el.textContent = formatLarge(d.opn.marketCap);
      });
      document.querySelectorAll('[data-price-liquidity="opn"]').forEach(el => {
        el.textContent = formatLarge(d.opn.liquidity);
      });
      // Last updated
      document.querySelectorAll('[data-price-updated]').forEach(el => {
        el.textContent = d.lastUpdated ? d.lastUpdated.toLocaleTimeString() : '--';
      });
    });
  }

  return {
    data,
    fetchAll,
    fetchBTCPrice,
    fetchOPNPrice,
    subscribe,
    start,
    stop,
    bindDOM,
    formatPrice,
    formatLarge,
    formatChange,
    changeColor,
  };

})();

window.PriceModule = PriceModule;
