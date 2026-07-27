<p align="center">
  <img src="frontend/logo.svg" alt="YieldFlow Logo" width="120" />
</p>

<h1 align="center">YieldFlow</h1>

<p align="center">
  <b>Real-time Streaming Payroll & Yield Optimization Protocol on Stellar</b>
</p>

<p align="center">
  <a href="https://yieldflow-frontend.vercel.app/"><b>🌐 Live Application</b></a> • 
  <a href="https://drive.google.com/file/d/1C4xNVGyy8ktO_lrmzq5TtMwOsT2-W3rL/view?usp=sharing"><b>🎬 Live Demo Video</b></a>
</p>

---

## 📌 Project Description

**YieldFlow** is a next-generation decentralized payroll and treasury management protocol built natively on the **Stellar** blockchain using **Soroban smart contracts**.

Traditional payroll suffers from idle capital drag—employers keep massive cash balances in non-yielding bank accounts while employees wait weeks for bi-weekly or monthly payouts. YieldFlow solves this on both sides of the equation:

- **For Employers**: Deposit USDC once into a yield-optimizing treasury vault. Capital is dynamically partitioned into a liquid instant buffer (e.g. 15%) for immediate employee payouts and an automated yield allocation (e.g. 85%) routed into liquidity pools like **Blend FixedV2**.
- **For Employees**: Wages unlock continuously in real-time, calculated down to the second. Workers can view their real-time earnings streaming visualizer and execute instant, gasless wage claims using hardware **WebAuthn Passkeys**.

---

## 🎥 Demo Video & Live App

- **🎬 Live Demo Video**: [Watch Demo Video on Google Drive](https://drive.google.com/file/d/1C4xNVGyy8ktO_lrmzq5TtMwOsT2-W3rL/view?usp=sharing)
- **🌐 Live Application**: [https://yieldflow-frontend.vercel.app/](https://yieldflow-frontend.vercel.app/)

---

## 📜 Contract Addresses

### 🟢 Stellar Mainnet

| Contract / Token | Address |
| :--- | :--- |
| **Vault Contract** | `CCS5IUVU3KRHEDQJHLZZGULEFQAFLXDBEE2FTTBZAHFOXEVH7T4VJWXW` |
| **Streaming Contract** | `CBDQ2ZHNX5Q7KU6GF733UOXH72FGGRUD6DDHBNXTPGXDF4E75VN3GUQ6` |
| **USDC Token (Circle SAC)** | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| **Blend Pool ID (FixedV2)** | `CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD` |

### 🟡 Stellar Testnet

| Contract / Token | Address |
| :--- | :--- |
| **Vault Contract** | `CDVT3Y47BTCZ2GLV4JJQTPGGFPJEXXM4BRJLLQIEZRVKRCNPO3M7CBVX` |
| **Streaming Contract** | `CCF4CYV2K7EVOP46UU7ZLS7Z3LEZKT5OIVCOQPGK6DKW7RWGUW6SESOS` |
| **USDC Token** | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| **Blend Pool ID** | `CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW` |

---

## 🛠️ Technology Stack

| Component | Stack |
| :--- | :--- |
| **Blockchain Platform** | Stellar + Soroban Smart Contracts (`soroban-sdk` v25) |
| **Smart Contracts** | Rust (Treasury Vault & Streaming Engine) |
| **DeFi Yield Layer** | Blend Protocol (FixedV2 Pool Direct Integration) |
| **Stablecoin Engine** | Circle USDC (Stellar Asset Contract) |
| **Frontend UI** | React 19, Vite 8, TypeScript 6 |
| **Graphics & FX** | Three.js & Custom WebGL Particle Atmosphere |
| **Animations** | GSAP, ScrollTrigger, Lenis Smooth Scroll |
| **Authentication** | WebAuthn Passkeys (SimpleWebAuthn / Passkey Kit) |
| **Serverless API** | Vercel Serverless Functions (`frontend/api`) |

---

## 📂 Repository Layout

```
YieldFlow/
├── contracts/     # Soroban Rust smart contracts (Vault & Streaming)
├── frontend/      # React 19 UI, WebGL shaders & Vercel API
├── deployments/   # Mainnet & Testnet deployment artifacts
├── docs/          # Architecture & technical specifications
├── config/        # Protocol catalogs & network configurations
├── scripts/       # Deployment and operations scripts
└── sdk/           # Generated Soroban contract TypeScript bindings
```

---

## ⚡ Quick Start (Local Setup)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Aman0choudhary/YieldFlow.git
   cd YieldFlow
   ```

2. **Install & Run Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Environment Secrets**:
   Set secrets in local environment / Vercel (do not commit `.env` files). Refer to `backend/.env.example` or `.env.example` inside `frontend/`.

---

## 🔒 Security Model

- **Passkey Sessions**: Employee wage claims rely on hardware WebAuthn device authentication.
- **Key Isolation**: No private keys are exposed in client-side frontend bundles.
- **Access Control**: Administrative vault operations and parameter adjustments require multi-sig authorization.

---

## 📄 License

Hackathon & Private Project. All rights reserved.
