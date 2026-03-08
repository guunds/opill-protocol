// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Wallet Module
//  Supports: OP_WALLET, UniSat, Xverse, OKX
//  No external dependencies — pure browser JS
// ═══════════════════════════════════════════════════════════════

'use strict';

const Wallet = (() => {

  // ── State ──
  const state = {
    connected: false,
    type: null,       // 'opwallet' | 'unisat' | 'xverse' | 'okx'
    address: null,
    publicKey: null,
    balance: 0,       // satoshis
    network: 'mainnet',
  };

  // ── Wallet metadata ──
  const META = {
    opwallet: {
      name: 'OP_WALLET',
      desc: 'Official OP_NET Bitcoin wallet',
      installUrl: 'https://chromewebstore.google.com/detail/opwallet/pmbjpcmaaladnfpacpmhmnfmpklgbdjb',
      icon: `<svg width="32" height="32" viewBox="0 0 100 100" fill="none">
        <defs><linearGradient id="og1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ff4400"/><stop offset="100%" stop-color="#f7931a"/>
        </linearGradient></defs>
        <circle cx="44" cy="58" r="30" fill="none" stroke="white" stroke-width="11"
          stroke-dasharray="145 48" stroke-dashoffset="-8" stroke-linecap="round"/>
        <circle cx="76" cy="26" r="14" fill="none" stroke="url(#og1)" stroke-width="9" stroke-linecap="round"/>
        <path d="M65 37 Q59 48 60 58" fill="none" stroke="url(#og1)" stroke-width="9" stroke-linecap="round"/>
      </svg>`,
      bg: '#0d0d0d',
      border: 'rgba(247,147,26,0.4)',
    },
    unisat: {
      name: 'UniSat Wallet',
      desc: 'Bitcoin & Ordinals wallet',
      installUrl: 'https://unisat.io/download',
      icon: `<svg width="30" height="30" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" fill="#f7931a"/>
        <path d="M18 15 L18 58 Q18 85 50 85 Q82 85 82 58 L82 15 L65 15 L65 58 Q65 68 50 68 Q35 68 35 58 L35 15 Z" fill="white"/>
      </svg>`,
      bg: '#f7931a',
      border: 'rgba(247,147,26,0.6)',
    },
    xverse: {
      name: 'Xverse Wallet',
      desc: 'Bitcoin, Ordinals & Stacks',
      installUrl: 'https://www.xverse.app/download',
      icon: `<svg width="28" height="28" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" fill="#1a1033"/>
        <defs><linearGradient id="xg1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FF6B35"/><stop offset="100%" stop-color="#EE7B30"/>
        </linearGradient></defs>
        <line x1="16" y1="16" x2="84" y2="84" stroke="url(#xg1)" stroke-width="15" stroke-linecap="round"/>
        <line x1="84" y1="16" x2="16" y2="84" stroke="url(#xg1)" stroke-width="15" stroke-linecap="round"/>
      </svg>`,
      bg: '#1a1033',
      border: 'rgba(238,123,48,0.35)',
    },
    okx: {
      name: 'OKX Wallet',
      desc: 'Multi-chain Bitcoin wallet',
      installUrl: 'https://www.okx.com/web3',
      icon: `<svg width="38" height="18" viewBox="0 0 120 36" fill="none">
        <path d="M2 18C2 8.6 8.6 2 18 2C27.4 2 34 8.6 34 18C34 27.4 27.4 34 18 34C8.6 34 2 27.4 2 18Z" stroke="white" stroke-width="4" fill="none"/>
        <path d="M11 18C11 14.2 14.2 11 18 11C21.8 11 25 14.2 25 18C25 21.8 21.8 25 18 25C14.2 25 11 21.8 11 18Z" fill="white"/>
        <rect x="40" y="2" width="6" height="32" rx="2" fill="white"/>
        <path d="M46 17L60 2L68 2L53 18L68 34L60 34Z" fill="white"/>
        <line x1="77" y1="2" x2="114" y2="34" stroke="white" stroke-width="6" stroke-linecap="round"/>
        <line x1="114" y1="2" x2="77" y2="34" stroke="white" stroke-width="6" stroke-linecap="round"/>
      </svg>`,
      bg: '#000000',
      border: 'rgba(255,255,255,0.15)',
    },
  };

  // ── Detect installed wallets ──
  function detectInstalled() {
    return {
      opwallet: !!(window.opnet || (window.unisat && window.unisat.isOPWallet)),
      unisat:   !!window.unisat,
      xverse:   !!(window.XverseProviders?.BitcoinProvider || (window.btc_providers && window.btc_providers.length > 0)),
      okx:      !!(window.okxwallet?.bitcoin),
    };
  }

  // ── Get provider by type ──
  function getProvider(type) {
    switch (type) {
      case 'opwallet': return window.opnet || window.unisat;
      case 'unisat':   return window.unisat;
      case 'xverse':   return window.XverseProviders?.BitcoinProvider || (window.btc_providers && window.btc_providers[0]);
      case 'okx':      return window.okxwallet?.bitcoin;
      default: return null;
    }
  }

  // ── Connect ──
  async function connect(type) {
    const provider = getProvider(type);
    if (!provider) {
      const meta = META[type];
      const err = new Error(`${meta.name} not installed`);
      err.installUrl = meta.installUrl;
      err.notInstalled = true;
      throw err;
    }

    let address = null;
    let publicKey = null;
    let network = 'mainnet';

    if (type === 'opwallet' || type === 'unisat') {
      const accounts = await provider.requestAccounts();
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      address = accounts[0];
      try { publicKey = await provider.getPublicKey(); } catch (_) {}
      try { network = await provider.getNetwork(); } catch (_) {}

    } else if (type === 'xverse') {
      const resp = await provider.request('getAddresses', {
        purposes: ['payment', 'ordinals'],
        message: 'OPiLL Protocol — Connect Wallet',
      });
      const addrs = resp?.result?.addresses;
      if (!addrs || addrs.length === 0) throw new Error('No address returned from Xverse');
      const pay = addrs.find(a => a.purpose === 'payment') || addrs[0];
      address = pay.address;
      publicKey = pay.publicKey;

    } else if (type === 'okx') {
      const accounts = await provider.requestAccounts();
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      address = accounts[0];
      try { publicKey = await provider.getPublicKey(); } catch (_) {}
    }

    if (!address) throw new Error('Could not retrieve wallet address');

    // Save state
    state.connected = true;
    state.type = type;
    state.address = address;
    state.publicKey = publicKey;
    state.network = network;

    // Fetch balance async
    fetchBalance().catch(() => {});

    // Listen for changes
    _listenChanges(type);

    // Persist session
    try { sessionStorage.setItem('opill_wallet', type); } catch (_) {}

    return { address, publicKey, network };
  }

  // ── Disconnect ──
  function disconnect() {
    state.connected = false;
    state.type = null;
    state.address = null;
    state.publicKey = null;
    state.balance = 0;
    try { sessionStorage.removeItem('opill_wallet'); } catch (_) {}
    _emit('disconnect', {});
  }

  // ── Fetch Balance ──
  async function fetchBalance() {
    if (!state.connected) return 0;
    try {
      let sats = 0;
      if (state.type === 'opwallet' || state.type === 'unisat') {
        const p = getProvider(state.type);
        const b = await p.getBalance();
        sats = b.total || b.confirmed || 0;
      } else if (state.type === 'okx') {
        const b = await window.okxwallet.bitcoin.getBalance();
        sats = b.total || b.confirmed || 0;
      } else if (state.type === 'xverse') {
        const xp = getProvider('xverse');
        const r = await xp.request('getBalance', null);
        sats = parseInt(r?.result?.confirmed || 0, 10);
      }
      state.balance = sats;
      _emit('balance', { sats, btc: satsToBtc(sats) });
      return sats;
    } catch (e) {
      console.warn('[Wallet] Balance fetch failed:', e.message);
      return 0;
    }
  }

  // ── Sign Message ──
  async function signMessage(message) {
    if (!state.connected) throw new Error('Wallet not connected');
    const p = getProvider(state.type);
    if (state.type === 'opwallet' || state.type === 'unisat') {
      return await p.signMessage(message);
    } else if (state.type === 'okx') {
      return await p.signMessage(message);
    } else if (state.type === 'xverse') {
      const r = await p.request('signMessage', { message, address: state.address });
      return r?.result?.signature;
    }
    throw new Error('signMessage not supported for this wallet');
  }

  // ── Sign PSBT ──
  async function signPsbt(psbtHex, options = {}) {
    if (!state.connected) throw new Error('Wallet not connected');
    const p = getProvider(state.type);
    if (state.type === 'opwallet' || state.type === 'unisat') {
      return await p.signPsbt(psbtHex, options);
    } else if (state.type === 'okx') {
      return await p.signPsbt(psbtHex, options);
    } else if (state.type === 'xverse') {
      const r = await p.request('signPsbt', { psbt: psbtHex, ...options });
      return r?.result?.psbt;
    }
    throw new Error('signPsbt not supported for this wallet');
  }

  // ── Helpers ──
  function satsToBtc(sats) {
    return (sats / 1e8).toFixed(6);
  }

  function shortenAddress(addr) {
    if (!addr) return '--';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 7)}...${addr.slice(-6)}`;
  }

  // ── Event emitter ──
  const _listeners = {};
  function _emit(event, data) {
    (_listeners[event] || []).forEach(fn => { try { fn(data); } catch (_) {} });
  }
  function on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
  }
  function off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(f => f !== fn);
  }

  // ── Account/network change listeners ──
  function _listenChanges(type) {
    const onAccounts = async (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
        _emit('disconnect', { reason: 'account_changed' });
        return;
      }
      state.address = accounts[0];
      await fetchBalance();
      _emit('accountChanged', { address: accounts[0] });
    };

    if (type === 'unisat' || type === 'opwallet') {
      const p = getProvider(type);
      try { p?.on?.('accountsChanged', onAccounts); } catch (_) {}
      try { p?.on?.('networkChanged', (n) => { state.network = n; _emit('networkChanged', { network: n }); }); } catch (_) {}
    } else if (type === 'okx') {
      try { window.okxwallet?.bitcoin?.on?.('accountsChanged', onAccounts); } catch (_) {}
    }
  }

  // ── Auto-reconnect from session ──
  async function tryAutoReconnect() {
    try {
      const saved = sessionStorage.getItem('opill_wallet');
      if (!saved) return false;
      const installed = detectInstalled();
      if (!installed[saved]) return false;
      await connect(saved);
      return true;
    } catch (_) {
      try { sessionStorage.removeItem('opill_wallet'); } catch (__) {}
      return false;
    }
  }

  // ── Public API ──
  return {
    state,
    META,
    detectInstalled,
    connect,
    disconnect,
    fetchBalance,
    signMessage,
    signPsbt,
    satsToBtc,
    shortenAddress,
    on,
    off,
    tryAutoReconnect,
  };

})();

// Make globally available
window.Wallet = Wallet;
