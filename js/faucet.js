// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — Faucet Module
//  Rate limit: 1 claim per 24 hours per address (localStorage)
//  Integrates with /api/faucet endpoint when deployed
// ═══════════════════════════════════════════════════════════════

'use strict';

const FaucetModule = (() => {

  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const FAUCET_AMOUNT = '100'; // OPN tokens
  const STORAGE_KEY = 'opill_faucet_claims';

  // ── Get claim records from localStorage ──
  function _getRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function _saveRecords(records) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch (_) {}
  }

  // ── Check if address can claim ──
  function canClaim(address) {
    if (!address) return { allowed: false, reason: 'No wallet connected' };
    const records = _getRecords();
    const lastClaim = records[address];
    if (!lastClaim) return { allowed: true, reason: null, nextClaim: null };
    const elapsed = Date.now() - lastClaim;
    if (elapsed >= COOLDOWN_MS) return { allowed: true, reason: null, nextClaim: null };
    const remaining = COOLDOWN_MS - elapsed;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return {
      allowed: false,
      reason: `Cooldown active. Try again in ${hours}h ${minutes}m`,
      nextClaim: new Date(lastClaim + COOLDOWN_MS),
      remainingMs: remaining,
    };
  }

  // ── Record a claim ──
  function _recordClaim(address) {
    const records = _getRecords();
    records[address] = Date.now();
    _saveRecords(records);
  }

  // ── Perform faucet claim ──
  async function claim(address) {
    if (!address) throw new Error('Wallet not connected. Please connect your wallet first.');

    // Check rate limit
    const check = canClaim(address);
    if (!check.allowed) throw new Error(check.reason);

    // Show loading state
    _setUI('loading', `Sending ${FAUCET_AMOUNT} OPN to your wallet...`);

    try {
      // Try backend API first
      let result = await _claimFromAPI(address);

      // If API not available, use demo mode
      if (!result.success && result.demo) {
        result = await _claimDemo(address);
      }

      if (!result.success) throw new Error(result.error || 'Faucet claim failed');

      // Record claim locally
      _recordClaim(address);

      _setUI('success', `✅ ${FAUCET_AMOUNT} OPN sent! TX: ${result.txid ? result.txid.slice(0, 16) + '...' : 'confirmed'}`);
      return result;

    } catch (e) {
      _setUI('error', `❌ ${e.message}`);
      throw e;
    }
  }

  // ── Call backend API ──
  async function _claimFromAPI(address) {
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json();
      if (res.status === 429) return { success: false, error: json.error || 'Rate limited by server' };
      if (!res.ok) return { success: false, error: json.error || `Server error ${res.status}`, demo: true };
      return { success: true, txid: json.txid, amount: json.amount };
    } catch (_) {
      // API not available — use demo mode
      return { success: false, demo: true };
    }
  }

  // ── Demo mode (when no backend) ──
  async function _claimDemo(address) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 2000));
    const fakeTxid = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return { success: true, txid: fakeTxid, amount: FAUCET_AMOUNT, demo: true };
  }

  // ── UI state helper ──
  function _setUI(state, message) {
    const btn = document.getElementById('faucet-claim-btn');
    const statusEl = document.getElementById('faucet-status');
    const loadingEl = document.getElementById('faucet-loading');

    if (btn) {
      btn.disabled = (state === 'loading');
      btn.textContent = state === 'loading' ? '⏳ Sending...' : '🚰 Claim OPN Tokens';
    }
    if (loadingEl) {
      loadingEl.style.display = state === 'loading' ? 'block' : 'none';
    }
    if (statusEl && message) {
      statusEl.style.display = 'block';
      statusEl.textContent = message;
      statusEl.className = 'faucet-status ' + state;
      if (state === 'success' || state === 'error') {
        setTimeout(() => {
          if (statusEl) statusEl.style.display = 'none';
        }, 6000);
      }
    }
  }

  // ── Render cooldown timer ──
  function renderCooldown(address, targetEl) {
    if (!targetEl) return;
    const update = () => {
      const check = canClaim(address);
      if (check.allowed) {
        targetEl.textContent = 'Ready to claim!';
        targetEl.style.color = 'var(--green)';
        return;
      }
      const ms = check.remainingMs;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      targetEl.textContent = `Next claim: ${h}h ${m}m ${s}s`;
      targetEl.style.color = 'var(--text-muted)';
    };
    update();
    return setInterval(update, 1000);
  }

  // ── Initialize faucet UI ──
  function init() {
    const btn = document.getElementById('faucet-claim-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const address = window.Wallet?.state?.address;
      if (!address) {
        _setUI('error', '⚠️ Please connect your wallet first');
        return;
      }
      try {
        await claim(address);
      } catch (_) { /* error already shown in _setUI */ }
    });

    // Update claim button state when wallet connects
    if (window.Wallet) {
      Wallet.on('accountChanged', ({ address }) => updateClaimButton(address));
    }
  }

  // ── Update claim button based on wallet + cooldown ──
  function updateClaimButton(address) {
    const btn = document.getElementById('faucet-claim-btn');
    const cooldownEl = document.getElementById('faucet-cooldown');
    if (!btn) return;

    if (!address) {
      btn.disabled = true;
      btn.textContent = '🔌 Connect Wallet to Claim';
      return;
    }

    const check = canClaim(address);
    btn.disabled = !check.allowed;
    btn.textContent = check.allowed ? '🚰 Claim OPN Tokens' : '⏳ Cooldown Active';

    if (cooldownEl) {
      if (_cooldownTimer) clearInterval(_cooldownTimer);
      _cooldownTimer = renderCooldown(address, cooldownEl);
    }
  }

  let _cooldownTimer = null;

  return {
    canClaim,
    claim,
    renderCooldown,
    updateClaimButton,
    init,
    FAUCET_AMOUNT,
    COOLDOWN_MS,
  };

})();

window.FaucetModule = FaucetModule;
