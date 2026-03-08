// ═══════════════════════════════════════════════════════════════
//  OPiLL Protocol — OP_NET RPC Module
//  Reads on-chain data via OP_NET JSON-RPC endpoints
//  No private keys — read-only from frontend
// ═══════════════════════════════════════════════════════════════

'use strict';

const OPNet = (() => {

  const ENDPOINTS = {
    mainnet: 'https://mainnet.opnet.org',
    testnet: 'https://testnet.opnet.org',
  };

  let _network = 'mainnet';
  let _endpoint = ENDPOINTS.mainnet;

  function setNetwork(net) {
    _network = (net === 'testnet') ? 'testnet' : 'mainnet';
    _endpoint = ENDPOINTS[_network];
  }

  function getNetwork() { return _network; }
  function getEndpoint() { return _endpoint; }

  // ── Generic JSON-RPC call ──
  async function rpc(method, params = []) {
    const res = await fetch(_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    });
    if (!res.ok) throw new Error(`RPC HTTP error: ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`RPC error: ${json.error.message || JSON.stringify(json.error)}`);
    return json.result;
  }

  // ── Get address balance (BTC in satoshis) ──
  async function getBalance(address) {
    try {
      const result = await rpc('btc_getBalance', [address]);
      return {
        confirmed: parseInt(result?.confirmed || 0, 10),
        unconfirmed: parseInt(result?.unconfirmed || 0, 10),
        total: parseInt(result?.total || result?.confirmed || 0, 10),
      };
    } catch (e) {
      console.warn('[OPNet] getBalance failed:', e.message);
      return { confirmed: 0, unconfirmed: 0, total: 0 };
    }
  }

  // ── Get OP20 token balance ──
  async function getTokenBalance(contractAddress, walletAddress) {
    try {
      const result = await rpc('op_getTokenBalance', [contractAddress, walletAddress]);
      return {
        balance: result?.balance || '0',
        decimals: result?.decimals || 8,
        symbol: result?.symbol || 'OPN',
      };
    } catch (e) {
      console.warn('[OPNet] getTokenBalance failed:', e.message);
      return { balance: '0', decimals: 8, symbol: 'OPN' };
    }
  }

  // ── Get latest block info ──
  async function getBlockInfo() {
    try {
      const result = await rpc('btc_getBlockCount', []);
      return { blockHeight: result || 0 };
    } catch (e) {
      console.warn('[OPNet] getBlockInfo failed:', e.message);
      return { blockHeight: 0 };
    }
  }

  // ── Get transaction history for address ──
  async function getTransactions(address, limit = 20) {
    try {
      const result = await rpc('btc_getTransactions', [address, limit]);
      return Array.isArray(result) ? result : [];
    } catch (e) {
      console.warn('[OPNet] getTransactions failed:', e.message);
      return [];
    }
  }

  // ── Broadcast raw transaction ──
  async function broadcastTx(rawTxHex) {
    const result = await rpc('btc_sendRawTransaction', [rawTxHex]);
    return result; // txid
  }

  // ── Staking info for address ──
  async function getStakingInfo(walletAddress) {
    try {
      const result = await rpc('op_getStakingInfo', [walletAddress]);
      return result || { staked: '0', rewards: '0', tier: 'None' };
    } catch (e) {
      return { staked: '0', rewards: '0', tier: 'None' };
    }
  }

  // ── Health check ──
  async function ping() {
    try {
      await getBlockInfo();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Format token amount with decimals ──
  function formatTokenAmount(raw, decimals = 8) {
    const n = BigInt(raw || '0');
    const d = BigInt(10) ** BigInt(decimals);
    const whole = n / d;
    const frac = n % d;
    const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '') || '0';
    return `${whole}.${fracStr}`;
  }

  return {
    setNetwork,
    getNetwork,
    getEndpoint,
    rpc,
    getBalance,
    getTokenBalance,
    getBlockInfo,
    getTransactions,
    broadcastTx,
    getStakingInfo,
    formatTokenAmount,
    ping,
  };

})();

window.OPNet = OPNet;
