# OPiLL Protocol

<p align="center">
Bitcoin DeFi Infrastructure built on the OP_NET ecosystem
</p>

<p align="center">

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Category](https://img.shields.io/badge/category-Bitcoin%20DeFi-orange)

</p>

---

# Live Application

Mainnet Dashboard

https://opill-protocol.vercel.app/

---

# Overview

OPiLL Protocol is a **Bitcoin-native DeFi platform** built on the **OP_NET ecosystem**.

The platform provides a modular dashboard for interacting with decentralized financial services built on Bitcoin infrastructure.

Users can access multiple DeFi primitives such as staking, lending, prediction markets, NFT marketplace, DAO governance, launchpad infrastructure, and reward systems.

The application is designed with a **modular frontend architecture and serverless backend endpoints** to allow fast deployment and scalability.

---

# Platform Modules

The OPiLL Protocol dashboard is divided into multiple product modules.

---

## Overview

Core system pages.

• 🏠 Home  
Main dashboard overview

• 🏆 Leaderboard  
Top users ranked by activity and rewards

• 📋 History  
Transaction and protocol interaction history

---

## Earn

Yield generating DeFi tools.

• ⚡ Staking  
Stake protocol tokens to earn rewards (18.5% APR)

• 🏦 Revenue Vault  
Protocol revenue sharing vault

• 💸 Lending  
Decentralized lending market

• 🔮 Prediction Market  
Decentralized event prediction system

• 🌾 Yield Aggregator  
Automated yield optimization strategies

---

## NFT & Social

Digital assets and community features.

• 🖼️ NFT Marketplace  
Buy and sell protocol NFTs

• 🚀 Launchpad  
Token and NFT project launches

• 🗳️ DAO Governance  
Community voting and proposals

• 🎰 Raffle / Lottery  
Community raffle and reward pools

---

## Tools

Protocol utility tools.

• 🔐 Multisig Wallet  
Multi-signature treasury management

• 🚰 Faucet  
Testnet / reward token faucet

---

## Rewards

Community incentive systems.

• ⭐ Airdrop Points  
Activity points for ecosystem participation

• 🎁 Airdrop Claim  
Claim distributed airdrop rewards

---

# Core Features

### Multi Wallet Support

Supports major Bitcoin ecosystem wallets.

| Wallet | Provider |
|------|------|
| OP_WALLET | window.opnet |
| UniSat | window.unisat |
| Xverse | window.XverseProviders |
| OKX Wallet | window.okxwallet.bitcoin |

---

### Real-Time Price Engine

Live token price feeds:

• BTC via CoinGecko  
• OPN via DexScreener  

Auto refresh interval: **20 seconds**

---

### Faucet System

Built-in faucet distribution system.

Features:

• 24 hour rate limit  
• Address validation  
• Serverless API endpoint  

---

### Activity Feed

Real-time UI activity feed displaying protocol interactions.

---

### Countdown Events

Protocol timers used for:

• Launchpad events  
• Airdrops  
• Token releases

---

# Project Structure

```
opill-protocol/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── wallet.js
│   ├── opnet.js
│   ├── price.js
│   ├── faucet.js
│   └── ui.js
│
├── api/
│   ├── faucet.js
│   └── price.js
│
├── vercel.json
├── netlify.toml
└── README.md
```

---

# Architecture

User  
│  
▼  
Wallet Connection  
│  
▼  
Frontend Dashboard  
│  
├ Wallet Integration  
├ UI Controller  
├ Price Engine  
└ Faucet Interface  
│  
▼  
Serverless API  
│  
├ Faucet Endpoint  
└ Price Proxy  
│  
▼  
OP_NET RPC  
│  
▼  
Bitcoin DeFi Infrastructure

---

# Deployment

## Vercel (Recommended)

Install CLI

```
npm install -g vercel
```

Deploy

```
vercel deploy
```

---

## Netlify

Upload project folder or drag & drop

```
https://netlify.com/drop
```

---

## Cloudflare Pages

Configuration

```
Build command: (empty)
Publish directory: .
```

---

# Local Development

Run Python server

```
python3 -m http.server 3000
```

Or Node server

```
npx serve .
```

---

# Environment Variables

Create `.env` file.

```
OPNET_RPC_URL=https://mainnet.opnet.org
OPN_CONTRACT_ADDRESS=<contract_address>
FAUCET_PRIVATE_KEY=<wallet_private_key>
NETWORK=mainnet
```

Never commit `.env` to GitHub.

---

# Security

Best practices used:

• Private keys never stored in frontend  
• Environment variables used for secrets  
• Faucet rate limiting implemented  
• Transactions should be simulated before broadcast  

For production scale use Redis / KV storage.

---

# Roadmap

Future protocol development.

• Smart contract integration  
• Staking reward engine  
• Cross-chain liquidity bridge  
• Advanced analytics dashboard  
• Governance voting upgrades  
• NFT ecosystem expansion  

---

# Contributing

Contributions are welcome.

1 Fork the repository  
2 Create a feature branch  
3 Commit your changes  
4 Open a pull request  

---

# License

MIT License

---

# OPiLL Protocol

Building the future of **Bitcoin-native DeFi infrastructure**
