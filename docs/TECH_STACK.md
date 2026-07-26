# YieldFlow — Technical Stack & Architecture

**Live app:** https://yieldflow-frontend.vercel.app/  
**Network:** Stellar **Mainnet** (Soroban)  
**Token:** Circle USDC (Stellar Asset Contract)

YieldFlow is streaming payroll on Stellar: employers deposit USDC once; capital splits into a liquid buffer and a yield leg; employees unlock wages per-second and withdraw with a device passkey.

---

## 1) Complete tech stack

### Blockchain / protocol

| Layer | Choice | Notes |
|-------|--------|--------|
| L1 | **Stellar** | Fast finality, low fees, native assets + SAC tokens |
| Smart contracts | **Soroban** (Rust, `soroban-sdk` **v25**) | WASM contracts, auth model, token interface |
| Payroll token | **Circle USDC** SAC | Mainnet: `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Yield engine (active) | **Blend FixedV2** pool (direct supply/withdraw) | Mainnet: `CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD` |
| Strategy reference | **DeFindex** USDC vault / Blend strategy | Live TVL + stack metadata; payroll yield path is direct Blend in MVP |
| RPC | Soroban RPC (mainnet) | Simulate + send transactions |

### Custom smart contracts

| Contract | Role | Mainnet ID |
|----------|------|------------|
| **Vault** | Deposit split (buffer/yield), Blend supply, buffer release, rebalance | `CCS5IUVU3KRHEDQJHLZZGULEFQAFLXDBEE2FTTBZAHFOXEVH7T4VJWXW` |
| **Streaming** | Per-employee schedule, unlock math, withdrawal accounting | `CBDQ2ZHNX5Q7KU6GF733UOXH72FGGRUD6DDHBNXTPGXDF4E75VN3GUQ6` |

Source: `contracts/contracts/vault`, `contracts/contracts/streaming`  
Deployment record: `deployments/mainnet.json`

### Backend / API

| Piece | Choice |
|-------|--------|
| Runtime | **Vercel Serverless** (`frontend/api/`) + optional local Node HTTP |
| Language | JavaScript (ESM) |
| Chain SDK | `@stellar/stellar-sdk` v14 (`rpc.Server`, `Contract`, `TransactionBuilder`) |
| Passkeys | `@simplewebauthn/server` + `@simplewebauthn/browser` (WebAuthn) |
| Sessions | HMAC-sealed tokens (Bearer), dedicated session secret |
| AI product guide | **Groq** (`llama-3.3-70b-versatile`) server-side only |
| Security | CORS allowlist, CSRF cookie, admin key for privileged ops, rate limits |

### Frontend

| Piece | Choice |
|-------|--------|
| Framework | **React 19** + **TypeScript** |
| Build | **Vite 6** |
| Motion / visuals | GSAP, Lenis, Three.js + React Three Fiber |
| Icons | Lucide |
| Employee auth UX | Platform passkeys (Face ID / Windows Hello / Touch ID) |
| Hosting | **Vercel** monorepo root → `frontend` install/build/output |

### Tooling

| Piece | Choice |
|-------|--------|
| Contract build | Rust + Cargo workspace, optimized release profile |
| Deploy / ops | PowerShell scripts under `scripts/` + Stellar CLI |
| Config | `config/*.json`, `deployments/*.json` |
| Secrets | Vercel env / local gitignored `.env` only — **never** `VITE_*` private keys |

---

## 2) Architecture

```
Employer USDC
      │
      ▼
YieldFlow Vault (Soroban)
      ├─ buffer_bps 1500  →  15% liquid buffer (instant unlock liquidity)
      └─ yield_bps  8500  →  85% supplied to Blend (earns yield)
                │
                ▼
         Blend FixedV2 (USDC supply)
                │
Streaming contract  ← per-employee total / start / end; unlocks by time
                │
Employee passkey session → API → vault.release_buffer → USDC to employee
                         ↘ streaming.record_withdrawal (accounting)
```

**DeFindex in this MVP:** the industry pattern is strategy vaults (DeFindex) routing into money markets (Blend). YieldFlow implements a **payroll vault + direct Blend** path and surfaces DeFindex as the live **strategy-layer reference** (TVL / fees / stack), not as a mandatory deposit hop for every payroll dollar yet.

---

## 3) Capital split & unlock math

- `buffer_bps = 1500` → **15%** stays liquid in the vault  
- `yield_bps = 8500` → **85%** routes to Blend (when pool is configured)  
- Token decimals: **7** (Stellar USDC style)

**Streaming unlock**

- before `start_time` → 0  
- after `end_time` → full `total_amount`  
- else → `total_amount * elapsed / duration`  
- withdrawable = unlocked − already withdrawn  

**Withdraw path**

1. Verify employee passkey session  
2. Read streaming balance (unlocked / withdrawable)  
3. `vault.release_buffer` to employee  
4. `streaming.record_withdrawal` for accounting  
5. Optional rebalance from Blend → buffer when buffer is thin  

---

## 4) Contract surface (high signal)

### Vault (`deposit_payroll`, `release_buffer`, `rebalance_to_buffer`, …)

| Function | Who | Purpose |
|----------|-----|---------|
| `init` | employer | employer, controller, streaming, token, buffer/yield bps |
| `set_blend_pool` | employer | attach / clear Blend pool for yield leg |
| `deposit_payroll` | employer | pull USDC, split buffer vs yield, supply yield to Blend |
| `stats` / `config` | anyone | vault state + config |
| `release_buffer` | withdrawal controller | pay employee from liquid buffer |
| `rebalance_to_buffer` | employer | pull from Blend back to buffer |

### Streaming (`create_stream`, `balance`, `record_withdrawal`, …)

| Function | Who | Purpose |
|----------|-----|---------|
| `init` | employer | employer + withdrawal controller |
| `create_stream` | employer | schedule employee total / start / end |
| `get_stream` / `balance` | anyone | stream + live unlock snapshot |
| `record_withdrawal` | withdrawal controller | mark unlocked amount as paid |

---

## 5) Auth & security model

### Employee

1. WebAuthn **register** / **authenticate** (`userVerification: required`)  
2. Server verifies assertion with `@simplewebauthn/server`  
3. Issues **HMAC session token** (Bearer)  
4. Credential material sealed client-side with server HMAC (no separate DB on Vercel)  
5. **Withdraw always requires** a valid employee session (admin key cannot withdraw as employee)

### Employer / operator money actions

- Deposit / create stream / rebalance require **same-site CSRF** and/or privileged admin header  
- Mainnet money ops are intentionally stricter than early testnet demos  
- CORS is **fail-closed** to the production app origin when configured  

### Hardening highlights

- Dedicated `YIELDFLOW_SESSION_SECRET` (not the signer secret)  
- Rate limits on auth, guide, and money routes  
- Employee allowlist  
- Passkey `RP_ID` / origin bound to production domain  
- AI guide runs server-side and refuses secret-extraction prompts  
- Security headers on Vercel (`X-Frame-Options`, nosniff, referrer policy, CSP on frontend config)

### Honest MVP custody note

The server holds a **hot signer** for smooth demo ops and passkey-driven withdraw UX. A production path is user-signed txs / relayer / multisig / MPC. This MVP prioritizes a seamless passkey experience; custody decentralization is the next milestone.

---

## 6) HTTP API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | network, contract IDs, security flags |
| GET | `/api/employer` | employer address + contracts |
| GET | `/api/stats` | vault pool, buffer, APY estimate, DeFindex ref |
| GET | `/api/defindex` | strategy-layer overview |
| GET | `/api/activity` | recent actions |
| GET | `/api/employee/session` | session status |
| GET | `/api/employee/balance` | unlocked / rate / cap (zeros if no stream) |
| POST | `/api/employee/passkey/*` | register + login WebAuthn |
| POST | `/api/deposit` | fund vault |
| POST | `/api/stream/create` | authorize employee stream |
| POST | `/api/withdraw` | passkey session → release buffer |
| POST | `/api/rebalance` | Blend → buffer |
| POST | `/api/guide` | in-app product AI guide |
| GET | `/api/tx/status` | transaction status helper |

Primary implementation: `frontend/api/index.mjs` (+ `security-lib.mjs`, `passkey-lib.mjs`).

---

## 7) Frontend product surfaces

| View | Component | Role |
|------|-----------|------|
| Landing | `LoginScreen` | product thesis, mechanics, ecosystem |
| Employer | `EmployerDashboard` | treasury vault, yield, ledger, stream metrics |
| Employee | `EmployeeBalance` | live unlock counter, withdraw, settlements |
| Approvals | `ApprovalScreen` | stream authorization cards + audit log |
| Admin | `AdminPanel` | operator console (privileged) |
| Guide | `GuideAgent` | floating AI product guide |
| Shell | `Layout`, `MenuOverlay`, `Background` | navigation + WebGL atmosphere |

Browser SDK bridge: `frontend/src/sdk/yieldflow-sdk.ts` (+ passkey helpers).

---

## 8) Repo layout

```
contracts/          Soroban vault + streaming (Rust workspace)
frontend/           React app + Vercel serverless API (primary deploy unit)
api/                Root API mirror for Vercel monorepo detection
backend/            Optional local Node API copy
sdk/                Generated bindings + SDK notes
docs/               Public technical docs (this file)
deployments/        Testnet + mainnet deployment records
config/             Network / USDC / Blend / DeFindex catalogs
scripts/            Build, deploy, readiness helpers
```

---

## 9) End-to-end happy path

1. Health → mainnet contracts present, Blend enabled  
2. Employer / operator funds vault with USDC (XLM alone is not payroll)  
3. Create employee stream (amount + schedule)  
4. Employee passkey login  
5. Balance unlocks over time  
6. Withdraw unlocked USDC → on-chain tx  

If deposit / stream steps are skipped, dashboards correctly show **zeros**. That is expected idle state, not a bug.

---

## 10) Local quick start

```bash
cd frontend
npm install
npm run dev
```

Contracts:

```bash
cd contracts
cargo test
stellar contract build
```

Env templates live in `backend/.env.example` / `backend/.env.mainnet.example` and Vercel project settings. **Never commit real secrets.**

---

## 11) What this submission proves

- Custom Soroban **vault + streaming** contracts on **mainnet**  
- **15/85 buffer/yield** split with **Blend** as the live yield leg  
- **Passkey (WebAuthn)** employee auth and session-gated withdraw  
- Production-style API hardening (CORS, CSRF, rate limits, secret isolation)  
- Full product UI (employer treasury, employee stream, approvals, guide) on Vercel  

For on-chain IDs and deploy timestamps, see `deployments/mainnet.json`.
