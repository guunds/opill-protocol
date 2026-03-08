// ═══════════════════════════════════════════════════════════════
//  opnetTokens.js — OPNet OP-20 Dynamic Token Service
//  Fetches all OP-20 tokens owned by the connected Bitcoin address
//  and dynamically renders them in the Wallet Assets section.
//
//  Strategy:
//   1. Query OPNet explorer API: /api/address/{address}
//   2. Fall back to /api/tokens/{address}
//   3. Filter out tokens already shown in hardcoded cards
//   4. Render remaining tokens as dynamic cards
// ═══════════════════════════════════════════════════════════════

'use strict';

var OP20Service = (function () {

  // ── Config ──────────────────────────────────────────────────
  var EXPLORER_BASE = 'https://explorer.opnet.org';

  // Known contracts already shown in hardcoded WA cards (lowercase)
  var KNOWN_CONTRACTS = {
    '0xe3e58e9615ac3e8a29a316c64b8c5930600941096377e227cc456bebb7daf3ee': 'opill',
    '0xb09fc29c112af8293539477e23d8df1d3126639642767d707277131352040cbb': 'pill',
    '0xfd4473840751d58d9f8b73bdd57d6c5260453d5518bd7cd02d0a4cf3df9bf4dd': 'moto'
  };

  // Container id where dynamic cards are appended
  var DYNAMIC_CONTAINER_ID = 'wa-op20-dynamic';

  // ── Internal state ───────────────────────────────────────────
  var _currentAddr = null;

  // ─────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────

  /**
   * getOP20Tokens(address)
   * Fetches all OP-20 tokens for the given Bitcoin address from OPNet explorer.
   * Returns an array of token objects: { symbol, name, balance, contract, decimals, logo }
   * Returns [] if none found or on error.
   */
  async function getOP20Tokens(address) {
    if (!address) return [];

    var tokens = [];

    // ── Try primary endpoint: /api/address/{address} ──
    try {
      var url1 = EXPLORER_BASE + '/api/address/' + encodeURIComponent(address);
      var resp1 = await fetch(url1, { signal: AbortSignal.timeout(8000) });
      if (resp1.ok) {
        var data1 = await resp1.json();
        // Expected shape: { tokens: [{symbol, balance, contract?, decimals?}] }
        // or: { op20: [...] } or direct array
        tokens = _parseTokenResponse(data1);
        if (tokens.length > 0) return tokens;
      }
    } catch (e1) { /* try next endpoint */ }

    // ── Fallback: /api/tokens/{address} ──
    try {
      var url2 = EXPLORER_BASE + '/api/tokens/' + encodeURIComponent(address);
      var resp2 = await fetch(url2, { signal: AbortSignal.timeout(8000) });
      if (resp2.ok) {
        var data2 = await resp2.json();
        tokens = _parseTokenResponse(data2);
        if (tokens.length > 0) return tokens;
      }
    } catch (e2) { /* no tokens found */ }

    return [];
  }

  // ─────────────────────────────────────────────────────────────
  //  CALLED BY WA MODULE: on wallet connect/disconnect
  // ─────────────────────────────────────────────────────────────

  /**
   * onConnect(address) — fetch and render dynamic OP-20 tokens
   */
  async function onConnect(address) {
    _currentAddr = address;
    _ensureContainer();
    _showLoading();

    try {
      var tokens = await getOP20Tokens(address);

      // Filter out tokens already shown in hardcoded cards
      var newTokens = tokens.filter(function (tok) {
        var contract = (tok.contract || '').toLowerCase();
        return !KNOWN_CONTRACTS[contract];
      });

      _renderTokenCards(newTokens);
    } catch (e) {
      _renderError();
    }
  }

  /**
   * onDisconnect() — clear dynamic cards
   */
  function onDisconnect() {
    _currentAddr = null;
    var container = document.getElementById(DYNAMIC_CONTAINER_ID);
    if (container) container.innerHTML = '';
    // Hide the dynamic section wrapper
    var wrapper = document.getElementById(DYNAMIC_CONTAINER_ID + '-wrap');
    if (wrapper) wrapper.style.display = 'none';
  }

  /**
   * refresh() — re-fetch for current address
   */
  async function refresh() {
    if (_currentAddr) await onConnect(_currentAddr);
  }

  // ─────────────────────────────────────────────────────────────
  //  PRIVATE: Parse API response into normalised token array
  // ─────────────────────────────────────────────────────────────
  function _parseTokenResponse(data) {
    if (!data) return [];

    // Shape A: { tokens: [...] }
    if (data.tokens && Array.isArray(data.tokens)) {
      return data.tokens.map(_normalise);
    }

    // Shape B: { op20: [...] }
    if (data.op20 && Array.isArray(data.op20)) {
      return data.op20.map(_normalise);
    }

    // Shape C: { balances: [...] }
    if (data.balances && Array.isArray(data.balances)) {
      return data.balances.map(_normalise);
    }

    // Shape D: direct array
    if (Array.isArray(data)) {
      return data.map(_normalise);
    }

    // Shape E: { result: [...] }
    if (data.result && Array.isArray(data.result)) {
      return data.result.map(_normalise);
    }

    return [];
  }

  // Normalise a raw token object into a consistent shape
  function _normalise(raw) {
    if (!raw) return null;
    return {
      symbol:   raw.symbol   || raw.sym      || raw.ticker || 'UNKNOWN',
      name:     raw.name     || raw.symbol   || raw.ticker || 'Unknown Token',
      balance:  _parseBalance(raw.balance    || raw.amount || raw.value || '0',
                              raw.decimals   || 8),
      contract: (raw.contract || raw.address || raw.contractAddress || '').toLowerCase(),
      decimals: parseInt(raw.decimals || 8, 10),
      logo:     raw.logo     || raw.icon     || raw.image  || null
    };
  }

  // Parse balance string, applying decimals
  function _parseBalance(raw, decimals) {
    var n = parseFloat(raw);
    if (isNaN(n)) return 0;
    // If the value looks like a raw integer (very large), divide by 10^decimals
    if (n > 1e10) n = n / Math.pow(10, decimals || 8);
    return Math.max(0, n);
  }

  // ─────────────────────────────────────────────────────────────
  //  PRIVATE: DOM helpers
  // ─────────────────────────────────────────────────────────────

  // Make sure the dynamic cards container exists in the DOM
  function _ensureContainer() {
    var grid = document.getElementById('wa-cards-grid');
    if (!grid) return;

    var wrapper = document.getElementById(DYNAMIC_CONTAINER_ID + '-wrap');
    if (!wrapper) {
      // Insert a separator + dynamic grid after the existing cards grid
      wrapper = document.createElement('div');
      wrapper.id = DYNAMIC_CONTAINER_ID + '-wrap';
      wrapper.style.cssText = 'margin-top:16px';

      // Divider with label
      var divider = document.createElement('div');
      divider.style.cssText = [
        'display:flex;align-items:center;gap:10px;',
        'margin-bottom:12px'
      ].join('');
      divider.innerHTML = [
        '<div style="flex:1;height:1px;background:rgba(255,255,255,0.06)"></div>',
        '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);',
        'text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap">',
        'Other OP-20 Tokens</div>',
        '<div style="flex:1;height:1px;background:rgba(255,255,255,0.06)"></div>'
      ].join('');
      wrapper.appendChild(divider);

      // Dynamic cards container
      var container = document.createElement('div');
      container.id = DYNAMIC_CONTAINER_ID;
      container.style.cssText = [
        'display:grid;',
        'grid-template-columns:repeat(auto-fill,minmax(160px,1fr));',
        'gap:12px'
      ].join('');
      wrapper.appendChild(container);

      // Insert after the wa-cards-grid (not inside it)
      grid.parentNode.insertBefore(wrapper, grid.nextSibling);
    }

    // Show the wrapper while we load
    wrapper.style.display = 'block';
  }

  function _showLoading() {
    var container = document.getElementById(DYNAMIC_CONTAINER_ID);
    if (!container) return;
    container.innerHTML = [
      '<div style="grid-column:1/-1;text-align:center;padding:20px 10px;',
      'color:rgba(255,255,255,0.25);font-size:11px">',
      '<span class="wa-skeleton" style="display:inline-block;',
      'width:120px;height:14px;border-radius:4px"></span>',
      '</div>'
    ].join('');
  }

  function _renderError() {
    var container = document.getElementById(DYNAMIC_CONTAINER_ID);
    var wrapper   = document.getElementById(DYNAMIC_CONTAINER_ID + '-wrap');
    if (!container) return;
    // Hide entire section on error — don't distract user
    if (wrapper) wrapper.style.display = 'none';
  }

  function _renderTokenCards(tokens) {
    var container = document.getElementById(DYNAMIC_CONTAINER_ID);
    var wrapper   = document.getElementById(DYNAMIC_CONTAINER_ID + '-wrap');
    if (!container) return;

    // Filter out null entries
    tokens = (tokens || []).filter(Boolean);

    if (tokens.length === 0) {
      // Show "No additional OP-20 tokens" message, then hide after 3 s
      container.innerHTML = [
        '<div style="grid-column:1/-1;text-align:center;padding:14px 10px;',
        'color:rgba(255,255,255,0.2);font-size:11px;',
        'border:1px solid rgba(255,255,255,0.05);border-radius:10px">',
        'No additional OP-20 tokens found for this address.</div>'
      ].join('');
      setTimeout(function () {
        if (wrapper) wrapper.style.display = 'none';
      }, 3000);
      return;
    }

    container.innerHTML = '';
    tokens.forEach(function (tok) {
      if (!tok) return;
      container.appendChild(_buildCard(tok));
    });
  }

  // Build a single dynamic token card
  function _buildCard(tok) {
    // Generate a deterministic accent colour from symbol characters
    var hue = _symbolToHue(tok.symbol);
    var accent  = 'hsl(' + hue + ',80%,60%)';
    var accentA = 'hsla(' + hue + ',80%,60%,0.15)';
    var accentB = 'hsla(' + hue + ',80%,60%,0.05)';
    var accentC = 'hsla(' + hue + ',80%,60%,0.20)';

    // Format balance
    var bal = tok.balance || 0;
    var balFmt;
    if (bal === 0)         balFmt = '0';
    else if (bal >= 1e6)   balFmt = (bal / 1e6).toFixed(2) + 'M';
    else if (bal >= 1e3)   balFmt = (bal / 1e3).toFixed(2) + 'K';
    else if (bal < 0.00001) balFmt = bal.toFixed(8);
    else                   balFmt = bal.toFixed(4);

    // Short contract display
    var contractDisplay = tok.contract
      ? tok.contract.slice(0, 8) + '…' + tok.contract.slice(-6)
      : 'Unknown';

    // Logo — either an img tag or an emoji fallback
    var logoHtml = tok.logo
      ? '<img src="' + _escAttr(tok.logo) + '" '
        + 'style="width:100%;height:100%;object-fit:cover;border-radius:50%" '
        + 'onerror="this.parentElement.innerHTML=\'&#x26A1;\'">'
      : '<span style="font-size:16px">' + (tok.symbol.slice(0, 2)) + '</span>';

    var card = document.createElement('div');
    card.className = 'wa-card wa-op20-dyn-card';
    card.setAttribute('data-contract', tok.contract);
    card.style.cssText = [
      'background:linear-gradient(135deg,' + accentB + ',' + 'rgba(0,0,0,0.02));',
      'border:1px solid ' + accentC + ';',
      'border-radius:14px;padding:14px;position:relative;overflow:hidden;',
      'transition:border-color 0.3s,transform 0.2s;cursor:default'
    ].join('');

    // Hover glow
    card.onmouseover = function () {
      this.style.borderColor = accent;
      this.style.transform   = 'translateY(-2px)';
    };
    card.onmouseout = function () {
      this.style.borderColor = accentC;
      this.style.transform   = 'translateY(0)';
    };

    card.innerHTML = [
      // Background radial glow
      '<div style="position:absolute;top:0;right:0;width:70px;height:70px;',
      'background:radial-gradient(circle,' + accentA + ',transparent 70%);',
      'pointer-events:none"></div>',

      // Header row: logo + name
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">',
        '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;',
        'flex-shrink:0;border:1.5px solid ' + accent + ';',
        'box-shadow:0 0 10px ' + accentA + ';',
        'display:flex;align-items:center;justify-content:center;',
        'background:rgba(0,0,0,0.3);font-weight:700;color:' + accent + ';',
        'font-size:11px">',
          logoHtml,
        '</div>',
        '<div>',
          '<div style="font-family:Syne,sans-serif;font-weight:800;',
          'font-size:13px;color:#fff;white-space:nowrap;overflow:hidden;',
          'text-overflow:ellipsis;max-width:90px">' + _escHtml(tok.symbol) + '</div>',
          '<div style="font-size:9px;color:' + accent + ';font-weight:600">',
          'OP_NET · OP-20</div>',
        '</div>',
      '</div>',

      // Balance row
      '<div style="margin-bottom:10px">',
        '<div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:3px;',
        'text-transform:uppercase;letter-spacing:0.06em">Balance</div>',
        '<div style="font-family:Syne,sans-serif;font-weight:800;font-size:18px;',
        'color:' + accent + ';line-height:1">' + _escHtml(balFmt) + '</div>',
      '</div>',

      // Footer: contract
      '<div style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)">',
        '<div style="font-size:9px;color:rgba(255,255,255,0.3);margin-bottom:2px;',
        'text-transform:uppercase;letter-spacing:0.06em">Contract</div>',
        '<div style="font-size:9px;color:rgba(255,255,255,0.25);',
        'font-family:DM Mono,monospace;overflow:hidden;text-overflow:ellipsis;',
        'white-space:nowrap" title="' + _escAttr(tok.contract) + '">',
        _escHtml(contractDisplay) + '</div>',
      '</div>'
    ].join('');

    return card;
  }

  // Deterministic hue from token symbol
  function _symbolToHue(sym) {
    var h = 0;
    for (var i = 0; i < (sym || '').length; i++) {
      h = ((h << 5) - h + sym.charCodeAt(i)) >>> 0;
    }
    return h % 360;
  }

  function _escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _escAttr(s) {
    return String(s || '')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─────────────────────────────────────────────────────────────
  //  Public surface
  // ─────────────────────────────────────────────────────────────
  return {
    getOP20Tokens: getOP20Tokens,
    onConnect:     onConnect,
    onDisconnect:  onDisconnect,
    refresh:       refresh
  };

})();

// Expose globally
window.OP20Service = OP20Service;
