# OPiLL Protocol — Bitcoin DeFi Frontend

A full-stack **Bitcoin DeFi dashboard** built on the **OP_NET ecosystem**, providing wallet connectivity, real-time token data, faucet distribution, and modular protocol interfaces including staking, vaults, lending, NFTs, DAO governance, and launchpad.

Designed for fast deployment on modern edge platforms such as **Vercel, Netlify, and Cloudflare Pages**.

---

# Overview

OPiLL Protocol provides a **modular frontend interface** for interacting with Bitcoin-based DeFi infrastructure through **OP_NET**.

Core capabilities include:

- Multi-wallet Bitcoin connection
- Real-time token pricing
- Faucet distribution system
- Modular DeFi dashboard
- Serverless API endpoints
- Edge deployment support

---

# Project Structure

```
opill-protocol/
│
├── index.html
│   Main application entry containing all UI sections
│
├── css/
│   └── style.css
│       Global styles and layout
│
├── js/
│   ├── wallet.js
│   │   Multi-wallet connection handler
│   │   (OP_WALLET, UniSat, Xverse, OKX)
│   │
│   ├── opnet.js
│   │   OP_NET RPC integration layer
│   │
│   ├── price.js
│   │   Real-time token price service
│   │   (DexScreener + CoinGecko)
│   │
│   ├── faucet.js
│   │   Faucet system with 24h rate limiting
│   │
│   └── ui.js
│       UI controller, navigation, modal, toast
│
├── api/
│   ├── faucet.js
│   │   Vercel serverless faucet endpoint
│   │
│   └── price.js
│       Serverless price proxy endpoint
│
├── vercel.json
│   Vercel deployment configuration
│
├── netlify.toml
│   Netlify deployment configuration
│
└── README.md
```

---

# Features

## Wallet Integration

Supports multiple Bitcoin ecosystem wallets:

| Wallet | Provider | Status |
|------|------|------|
| OP_WALLET | `window.opnet` | Primary |
| UniSat | `window.unisat` | Supported |
| Xverse | `window.XverseProviders` | Supported |
| OKX Wallet | `window.okxwallet.bitcoin` | Supported |

---

## Core Capabilities

### Wallet Connection

- Connect / disconnect wallet
- Session persistence
- Automatic balance detection

### Balance Display

Displays the user's real **BTC balance** after wallet connection.

### Real-Time Price Feeds

- BTC via **CoinGecko**
- OPN via **DexScreener**
- Updates every **20 seconds**

### Faucet System

- Rate-limited token claim
- 24-hour cooldown
- Backend verification

### Protocol Dashboard

Includes **16 protocol sections** such as:

- Home
- Staking
- Vault
- Lending
- NFT
- DAO
- Launchpad
- Analytics
- Treasury
- Governance

### Live Activity Feed

Animated interface displaying **recent protocol activity**.

### Countdown Timer

Used for:

- IDO events
- Token launches
- Airdrop campaigns

---

# Deployment

## Vercel (Recommended)

Install Vercel CLI:

```
npm install -g vercel
```

Deploy:

```
vercel deploy
```

---

## Netlify

Upload the project folder directly or drag & drop to:

```
https://netlify.com/drop
```

---

## Cloudflare Pages

Upload the project directory via Cloudflare dashboard.

Configuration:

```
Build command: (empty)
Publish directory: .
```

---

# Local Development

### Python Server

```
python3 -m http.server 3000
```

### Node Static Server

```
npx serve .
```

### VS Code

Use the **Live Server extension** to run locally.

---

# Environment Variables

Create a `.env` file in the project root.

Never commit this file to version control.

```
OPNET_RPC_URL=https://mainnet.opnet.org
OPN_CONTRACT_ADDRESS=<your_contract_address>
FAUCET_PRIVATE_KEY=<wallet_wif_key>
NETWORK=mainnet
```

---

# OP_NET SDK (Production Transactions)

Install the required packages:

```
npm install @btc-vision/transaction
npm install @btc-vision/bitcoin
npm install opnet
```

Example implementation can be found in:

```
api/faucet.js
```

---

# Customization

### Token Name / Symbol

Search and replace:

```
OPN
```

Across all project files.

### Contract Address

Update:

```
OPN_CONTRACT_ADDRESS
```

Inside:

```
.env
api/faucet.js
```

### Token Price Source

Modify DexScreener query inside:

```
js/price.js
api/price.js
```

### Faucet Amount

Adjust:

```
FAUCET_AMOUNT
```

Inside:

```
js/faucet.js
api/faucet.js
```

### RPC Endpoint

Edit RPC endpoints inside:

```
js/opnet.js
```

---

# Security Notes

Important security practices:

- Never expose **private keys in frontend code**
- Always store secrets in **environment variables**
- Faucet rate limiting currently uses **in-memory storage**
- For production scale use **Redis / Upstash KV**
- Always **simulate transactions before broadcasting**

---

# License

MIT License
