# OPiLL Protocol — Bitcoin DeFi Frontend

Full-stack Bitcoin DeFi dashboard built on OP_NET ecosystem.

## 🏗️ Project Structure

```
opill-protocol/
├── index.html          ← Main app (all sections)
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── wallet.js       ← Wallet connection (OP_WALLET, UniSat, Xverse, OKX)
│   ├── opnet.js        ← OP_NET RPC integration
│   ├── price.js        ← Real-time token prices (DexScreener + CoinGecko)
│   ├── faucet.js       ← Faucet system with 24h rate limiting
│   └── ui.js           ← UI controller, navigation, modal, toast
├── api/
│   ├── faucet.js       ← Vercel serverless faucet endpoint
│   └── price.js        ← Vercel serverless price proxy endpoint
├── vercel.json         ← Vercel deploy config
├── netlify.toml        ← Netlify deploy config
└── README.md
```

## 🚀 Deploy

### Vercel (Recommended)
```bash
npm i -g vercel
vercel deploy
```

### Netlify
Drag & drop the `opill-protocol/` folder to [netlify.com/drop](https://app.netlify.com/drop)

### Cloudflare Pages
1. Upload folder via Cloudflare dashboard
2. Set build command: (empty)
3. Set publish directory: `.`

### Local Development
```bash
# Option 1: Python simple server
python3 -m http.server 3000

# Option 2: Node
npx serve .

# Option 3: VS Code Live Server extension
```

## ✅ Wallet Support

| Wallet | Provider | Status |
|--------|----------|--------|
| OP_WALLET | `window.opnet` | ✅ Primary |
| UniSat | `window.unisat` | ✅ Supported |
| Xverse | `window.XverseProviders` | ✅ Supported |
| OKX | `window.okxwallet.bitcoin` | ✅ Supported |

## 💡 Features

- **Wallet Connection** — Connect/disconnect with session persistence
- **Balance Display** — Real BTC balance from wallet after connect
- **Real-Time Prices** — BTC via CoinGecko, OPN via DexScreener (updates every 20s)
- **Faucet** — 24h rate-limited token claim with backend API
- **Navigation** — 16 sections: Home, Staking, Vault, Lending, NFT, DAO, Launchpad, etc.
- **Live Activity Feed** — Animated recent protocol activity
- **Countdown Timer** — For IDO/airdrop events

## ⚙️ Environment Variables (for Vercel)

Create `.env` in project root (never commit this):
```
OPNET_RPC_URL=https://mainnet.opnet.org
OPN_CONTRACT_ADDRESS=<your_contract_address>
FAUCET_PRIVATE_KEY=<wallet_wif_key>
NETWORK=mainnet
```

## 📦 OP_NET SDK (for production transactions)

```bash
npm install @btc-vision/transaction @btc-vision/bitcoin opnet
```

See `api/faucet.js` for commented-out production transaction code.

## 🔧 Customization

- **Token name/symbol**: Search for `OPN` in all files
- **Contract address**: Update `OPN_CONTRACT_ADDRESS` in env + `api/faucet.js`
- **Price token**: Update DexScreener query in `js/price.js` and `api/price.js`
- **Faucet amount**: Change `FAUCET_AMOUNT` in `js/faucet.js` and `api/faucet.js`
- **RPC endpoint**: Update `ENDPOINTS` in `js/opnet.js`

## 🛡️ Security Notes

- Never put private keys in frontend JS
- Use environment variables for all secrets
- Rate limiting is in-memory (use Redis/Upstash KV for production scale)
- Always simulate transactions before broadcasting

---
Built on Bitcoin Layer 1 · Powered by OP_NET · Trustless · Non-Custodial
