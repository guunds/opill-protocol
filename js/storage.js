// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Persistent Storage Module
//  Menyimpan semua data ke localStorage agar tidak hilang saat
//  refresh / tutup browser. Data dibind per wallet address.
//  
//  Data yang disimpan:
//    • Transaction History (_txLog)
//    • Staking positions & stats (_stakeData)
//    • Vault positions (_vaultPositions)
//    • Lending positions & state (_lendState, _lendPositions)
//    • Airdrop points, tasks, breakdown (_userPoints, _apTasks, _apPointsBreakdown)
//    • Leaderboard my-row
// ═══════════════════════════════════════════════════════════════

'use strict';

var OPiLLStorage = (function() {

  var _wallet = null; // active wallet address (lowercase)

  // ── Key builders ──
  function _k(section) {
    return 'opill_v1_' + (_wallet || 'anon') + '_' + section;
  }

  // ── Low-level helpers ──
  function _save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      console.warn('[OPiLLStorage] Save failed:', key, e.message);
    }
  }

  function _load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch(e) {
      return fallback;
    }
  }

  function _del(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }

  // ── Init: set active wallet ──
  function init(walletAddress) {
    _wallet = (walletAddress || '').toLowerCase();
    console.log('[OPiLLStorage] Initialized for wallet:', _wallet.slice(0,10) + '...');
  }

  // ══════════════════════════════════════════
  //  TRANSACTION HISTORY
  // ══════════════════════════════════════════
  function saveTxLog(txArray) {
    _save(_k('txlog'), txArray);
  }

  function loadTxLog() {
    return _load(_k('txlog'), []);
  }

  // ══════════════════════════════════════════
  //  STAKING
  // ══════════════════════════════════════════
  function saveStaking(stakeData) {
    _save(_k('staking'), {
      tier:        stakeData.tier,
      apy:         stakeData.apy,
      totalStaked: stakeData.totalStaked,
      claimable:   stakeData.claimable,
      positions:   stakeData.positions,
      lastSaved:   Date.now()
    });
  }

  function loadStaking(defaults) {
    var saved = _load(_k('staking'), null);
    if (!saved) return defaults;
    // Recalculate earned since last save
    if (saved.positions && saved.lastSaved) {
      var elapsed = (Date.now() - saved.lastSaved) / 1000 / 60 / 60; // hours
      saved.positions.forEach(function(p) {
        var earned = p.amt * (p.apy / 100) * (elapsed / 8760); // per year
        p.earned = (p.earned || 0) + earned;
        saved.claimable = (saved.claimable || 0) + earned;
      });
    }
    return saved;
  }

  // ══════════════════════════════════════════
  //  VAULT
  // ══════════════════════════════════════════
  function saveVault(positions) {
    _save(_k('vault'), {
      positions: positions,
      lastSaved: Date.now()
    });
  }

  function loadVault() {
    var saved = _load(_k('vault'), null);
    if (!saved || !saved.positions) return [];
    // Recalculate earned
    if (saved.lastSaved) {
      var elapsed = (Date.now() - saved.lastSaved) / 1000 / 60 / 60;
      saved.positions.forEach(function(p) {
        var apy = parseFloat(p.apy) || 12;
        var earned = p.usd * (apy / 100) * (elapsed / 8760);
        p.earned = (p.earned || 0) + earned;
      });
    }
    return saved.positions;
  }

  // ══════════════════════════════════════════
  //  LENDING
  // ══════════════════════════════════════════
  function saveLending(lendState, lendPositions) {
    _save(_k('lending'), {
      state:     lendState,
      positions: lendPositions,
      lastSaved: Date.now()
    });
  }

  function loadLending() {
    return _load(_k('lending'), null);
  }

  // ══════════════════════════════════════════
  //  AIRDROP POINTS & TASKS
  // ══════════════════════════════════════════
  function saveAirdrop(points, tasks, breakdown) {
    _save(_k('airdrop'), {
      points:    points,
      tasksDone: tasks.filter(function(t){return t.done;}).map(function(t){return t.id;}),
      breakdown: breakdown
    });
  }

  function loadAirdrop() {
    return _load(_k('airdrop'), null);
  }

  // ══════════════════════════════════════════
  //  USER PROFILE (points + rank)
  // ══════════════════════════════════════════
  function saveUserPoints(points) {
    _save(_k('points'), points);
  }

  function loadUserPoints() {
    return _load(_k('points'), 0);
  }

  // ══════════════════════════════════════════
  //  CLEAR ALL DATA FOR CURRENT WALLET
  // ══════════════════════════════════════════
  function clearAll() {
    var sections = ['txlog', 'staking', 'vault', 'lending', 'airdrop', 'points'];
    sections.forEach(function(s) { _del(_k(s)); });
    console.log('[OPiLLStorage] All data cleared for wallet:', _wallet);
  }

  // ══════════════════════════════════════════
  //  STORAGE SIZE INFO
  // ══════════════════════════════════════════
  function getUsage() {
    var total = 0;
    try {
      for (var key in localStorage) {
        if (key.startsWith('opill_v1_' + _wallet)) {
          total += (localStorage.getItem(key) || '').length;
        }
      }
    } catch(e) {}
    return (total / 1024).toFixed(2) + ' KB';
  }

  // ── Public API ──
  return {
    init:           init,
    saveTxLog:      saveTxLog,
    loadTxLog:      loadTxLog,
    saveStaking:    saveStaking,
    loadStaking:    loadStaking,
    saveVault:      saveVault,
    loadVault:      loadVault,
    saveLending:    saveLending,
    loadLending:    loadLending,
    saveAirdrop:    saveAirdrop,
    loadAirdrop:    loadAirdrop,
    saveUserPoints: saveUserPoints,
    loadUserPoints: loadUserPoints,
    clearAll:       clearAll,
    getUsage:       getUsage,
  };

})();

window.OPiLLStorage = OPiLLStorage;
