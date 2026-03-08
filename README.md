# OPiLL Protocol

<p align="center">
Bitcoin Native DeFi Protocol built on OP_NET
</p>

<p align="center">
<a href="https://opill-protocol.vercel.app/">Live App</a> •
<a href="#features">Features</a> •
<a href="#installation">Installation</a> •
<a href="#deployment">Deployment</a> •
<a href="#architecture">Architecture</a>
</p>

---

# OPiLL Protocol — Bitcoin DeFi Dashboard

![Bitcoin](https://img.shields.io/badge/Built%20on-Bitcoin-orange)
![OP_NET](https://img.shields.io/badge/Layer-OP_NET-blue)
![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![License](https://img.shields.io/badge/License-MIT-green)
![Web3](https://img.shields.io/badge/Web3-DeFi-purple)

**OPiLL Protocol** is a **Bitcoin-native DeFi ecosystem** powered by **OP_NET smart contracts**.

The platform provides a **full-stack decentralized finance dashboard** allowing users to interact with Bitcoin DeFi primitives such as:

- Staking
- Lending
- Revenue vaults
- NFT marketplace
- DAO governance
- Launchpad
- Yield aggregation
- Airdrops and rewards

All interactions are **trustless, non-custodial, and secured by Bitcoin Layer 1.**

---

# Live Application

Access the protocol here

https://opill-protocol.vercel.app/

---

# Table of Contents

- Overview
- Features
- Application Navigation
- Wallet Support
- Architecture
- Project Structure
- Installation
- Local Development
- Deployment
- Environment Variables
- OP_NET Integration
- API Endpoints
- Faucet System
- Customization
- Security
- Roadmap
- Contributing
- License

---

# Overview

OPiLL Protocol brings **decentralized finance infrastructure to Bitcoin**.

Built on top of the **OP_NET protocol**, it enables smart contract interactions directly on **Bitcoin Layer 1**.

The dashboard allows users to:

- Connect Bitcoin wallets
- View balances
- Interact with DeFi protocols
- Stake tokens
- Participate in DAO governance
- Trade NFTs
- Join launchpads
- Claim rewards

---

# Features

## Wallet Integration

Supports multiple Bitcoin wallets.

- OP_WALLET (Primary)
- UniSat
- Xverse
- OKX Wallet

Automatic detection and connection using browser providers.

---

## Real-Time Market Data

Token prices are fetched using:

- CoinGecko (BTC price)
- DexScreener (OPN token)

Auto updates every **20 seconds**.

---

## DeFi Modules

OPiLL includes multiple DeFi primitives.

- Staking pools
- Lending markets
- Yield aggregator
- Revenue vaults
- Prediction markets

---

## NFT & Social Ecosystem

The platform integrates NFT and community features.

- NFT Marketplace
- Launchpad
- DAO Governance
- Lottery / Raffle

---

## Rewards System

Users can earn rewards through:

- Faucet tokens
- Airdrop points
- Airdrop claim campaigns

---

# Application Navigation

The OPiLL dashboard is divided into multiple sections.

## Main

- Home
- Leaderboard
- History

## Earn

- Staking (18.5% APY)
- Revenue Vault
- Lending
- Prediction Market
- Yield Aggregator

## NFT & Social

- NFT Marketplace
- Launchpad
- DAO Governance
- Raffle / Lottery

## Tools

- Multisig Wallet
- Faucet

## Rewards

- Airdrop Points
- Airdrop Claim

---

# Wallet Support

| Wallet | Provider | Status |
|------|------|------|
| OP_WALLET | window.opnet | Primary |
| UniSat | window.unisat | Supported |
| Xverse | window.XverseProviders | Supported |
| OKX Wallet | window.okxwallet.bitcoin | Supported |

---

# Architecture

OPiLL Protocol architecture combines:

Frontend Dashboard  
Serverless API Layer  
OP_NET RPC Infrastructure  
Bitcoin Wallet Providers

System Flow

User Wallet  
↓  
Frontend Dashboard  
↓  
Serverless API (Vercel)  
↓  
OP_NET RPC  
↓  
Bitcoin Network

---

# Project Structure

```
opill-protocol/

index.html
Main application dashboard

css/
style.css
Global styling

js/

wallet.js
Wallet connection logic

opnet.js
OP_NET RPC integration

price.js
Real-time token price fetching

faucet.js
Frontend faucet system

ui.js
UI navigation and components

api/

faucet.js
Serverless faucet endpoint

price.js
Serverless price proxy

vercel.json
Vercel deployment configuration

netlify.toml
Netlify deployment configuration

README.md
Project documentation
```

---

# Installation

Clone repository

```
git clone https://github.com/YOUR_USERNAME/opill-protocol.git
```

Enter directory

```
cd opill-protocol
```

---

# Local Development

Run a local server.

### Python

```
python3 -m http.server 3000
```

### Node

```
npx serve .
```

### VS Code

Use **Live Server Extension**

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

Drag and drop the project folder into

https://netlify.com/drop

---

## Cloudflare Pages

Upload project folder.

Settings

```
Build Command: (empty)

Publish Directory: .
```

---

# Environment Variables

Create a `.env` file.

```
OPNET_RPC_URL=https://mainnet.opnet.org
OPN_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
FAUCET_PRIVATE_KEY=YOUR_WALLET_WIF
NETWORK=mainnet
```

Never commit `.env` files to GitHub.

---

# OP_NET SDK

For production transactions install:

```
npm install @btc-vision/transaction
npm install @btc-vision/bitcoin
npm install opnet
```

Example usage is available in

```
api/faucet.js
```

---

# API Endpoints

Serverless API endpoints.

### Faucet API

```
/api/faucet
```

Handles token claims with rate limiting.

---

### Price API

```
/api/price
```

Proxy for external price data.

---

# Faucet System

The faucet distributes protocol tokens with:

- Wallet verification
- 24-hour rate limiting
- Serverless backend
- Anti-spam protection

Production scale can integrate:

- Redis
- Upstash KV
- Cloudflare KV

---

# Customization

You can easily modify protocol parameters.

Token symbol

Search and replace

```
OPN
```

Contract address

Update environment variable

```
OPN_CONTRACT_ADDRESS
```

Faucet amount

Modify

```
FAUCET_AMOUNT
```

RPC endpoint

Update

```
js/opnet.js
```

---

# Security

Security best practices implemented.

- No private keys stored in frontend
- Environment variables for secrets
- Transaction simulation before broadcast
- Rate limiting for faucet
- Wallet verification

Recommended production improvements:

- Redis rate limiting
- Backend signature verification
- RPC monitoring
- Smart contract audits

---

# Roadmap

### Phase 1

Protocol launch  
Wallet integrations  
Staking system  

### Phase 2

NFT marketplace  
Launchpad  
DAO governance  

### Phase 3

Cross-chain bridges  
NFT staking  
Advanced lending  

### Phase 4

Mobile dashboard  
Protocol SDK  
Developer API  

---

# Contributing

Contributions are welcome.

Fork repository

Create branch

```
git checkout -b feature-name
```

Commit changes

```
git commit -m "Add feature"
```

Push branch

```
git push origin feature-name
```

Create Pull Request.

---

# License

MIT License

Free for personal and commercial use.

---

# Built With

Bitcoin Layer 1  
OP_NET Protocol  
JavaScript  
Vercel Serverless Functions  

---

# OPiLL Protocol

Bitcoin Native DeFi Infrastructure

Trustless  
Non-Custodial  
Open Finance
