# YieldFlow — Judge Technical Q&A Pack

**Use this before demos / judging.**  
Live app: https://yieldflow-frontend.vercel.app/  
Repo: https://github.com/Aman0choudhary/YieldFlow  
Network target: **Stellar Mainnet** (Soroban)

---

## 0) Current demo state (honest)

| Item | Status |
|------|--------|
| Contracts deployed mainnet | Yes |
| Frontend + API on Vercel | Yes |
| Employee passkey login | Working |
| Employer dashboard | Working |
| Vault USDC balance | **0** until deposit |
| Employee stream | **None yet** until Approve/Create stream |
| APY shown | **0.0%** until vault has yield leg in Blend |
| XLM ops budget | Deployer had ~12 XLM after deploy; **+100 XLM available** for fees/ops |

**Why everything is $0 right now**  
Mainnet contracts are live but **idle capital has not been deposited**.  
Employee balance needs: (1) employer deposit USDC into vault, (2) `create_stream` for employee.  
XLM pays **fees / rent / contract ops** — it does **not** appear as payroll USDC.

---

## 1) One-line pitch

YieldFlow is **streaming payroll on Stellar/Soroban**: employer deposits USDC once; ~15% stays liquid for instant unlocks; ~85% is supplied to **Blend** for yield; employees unlock wages **per-second** and withdraw unlocked USDC with a **device passkey**.

---

## 2) Full tech stack

### Blockchain / protocol
| Layer | Choice | Why |
|-------|--------|-----|
| L1 | **Stellar** | Fast finality, low fees, native assets + SAC tokens |
| Smart contracts | **Soroban** (Rust, `soroban-sdk` **v25**) | WASM contracts, auth model, token interface |
| Payroll token | **Circle USDC** SAC | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` (mainnet) |
| Yield engine (active) | **Blend FixedV2 pool** (direct supply/withdraw) | `CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD` |
| Strategy reference | **DeFindex** USDC vault (read/stats; architecture layer) | Shows DeFindex → Blend stack; payroll yield path is **direct Blend** in MVP |
| RPC | Soroban RPC (mainnet; Lightsail used for lean deploy) | Simulate + send txs |

### Smart contracts (custom)
| Contract | Role | Mainnet ID |
|----------|------|------------|
| **Vault** | Deposit split buffer/yield, Blend supply, release buffer, rebalance | `CCS5IUVU3KRHEDQJHLZZGULEFQAFLXDBEE2FTTBZAHFOXEVH7T4VJWXW` |
| **Streaming** | Per-employee stream schedule, unlock math, withdrawal accounting | `CBDQ2ZHNX5Q7KU6GF733UOXH72FGGRUD6DDHBNXTPGXDF4E75VN3GUQ6` |

### Backend / API
| Piece | Choice |
|-------|--------|
| Runtime | **Vercel Serverless** (`frontend/api/index.mjs`) + optional local Node HTTP |
| Language | JavaScript (ESM) |
| Chain SDK | `@stellar/stellar-sdk` v14 (`rpc.Server`, `Contract`, `TransactionBuilder`) |
| Auth sessions | HMAC sealed tokens + Bearer session (WebAuthn-backed) |
| Passkeys | `@simplewebauthn/server` + `@simplewebauthn/browser` (WebAuthn / platform authenticators) |
| AI guide | **Groq** (`llama-3.3-70b-versatile`) server-side only — never exposes secrets |
| Security | CORS allowlist, CSRF cookie, admin key for money ops, rate limits, dedicated session secret |

### Frontend
| Piece | Choice |
|-------|--------|
| Framework | **React 19** + **TypeScript** |
| Build | **Vite 6** |
| UI motion | GSAP, Lenis, Three.js / R3F (visual layer) |
| Wallet UX (employer connect surface) | App/API bridged employer session (server signer model for MVP ops) |
| Employee auth UX | Real **platform passkeys** (Face ID / Windows Hello / Touch ID) |
| Hosting | **Vercel** (`yieldflow-frontend.vercel.app`) |

### Tooling / ops
| Piece | Choice |
|-------|--------|
| Contract build | Rust + Cargo workspace, `stellar`/`soroban` CLI deploy scripts |
| Deploy scripts | PowerShell (`scripts/deploy-mainnet.ps1`, readiness checks) |
| Identity | Stellar CLI identity `yieldflow-mainnet` (deployer G…) |
| Secrets | Vercel env only — **never** `VITE_*` for private keys |

### Mainnet operator addresses
| Role | Address |
|------|---------|
| Employer / deployer / demo employee (MVP smoke) | `GB65HDYFWIUA3UMCWJ3WCERBTS2L7YWHFKXIPMLYRXWEZI53WL7GTSTL` |

---

## 3) Architecture (say this out loud)

```
Employer USDC
    │
    ▼
YieldFlow Vault (Soroban)
    ├─ buffer_bps 1500  → 15% liquid buffer (instant withdraw liquidity)
    └─ yield_bps  8500  → 85% supplied to Blend pool (earns)
                │
                ▼
         Blend FixedV2 (USDC supply)
                │
Streaming contract  ← per-employee total/start/end; unlocks by time
                │
Employee passkey session → API → vault.release_buffer → USDC to employee
                         ↘ streaming.record_withdrawal (accounting)
```

**DeFindex role in pitch:** industry pattern is strategies/vaults (DeFindex) routing into money markets (Blend). YieldFlow MVP implements the **payroll vault + direct Blend** path and surfaces DeFindex as the live **strategy-layer reference** (TVL/fees/stack), not as the mandatory deposit hop for every payroll dollar yet.

---

## 4) Capital split & money math

- `buffer_bps = 1500` → **15%** stays in vault buffer  
- `yield_bps = 8500` → **85%** routed to Blend  
- Token decimals: **7** (Stellar USDC style)  
- Unlock formula (streaming):  
  - before start → 0  
  - after end → full `total_amount`  
  - else → `total_amount * elapsed / duration`  
  - withdrawable = unlocked − withdrawn  
- Withdraw path: only **unlocked** amount; pulls from **buffer** via `release_buffer`; may rebalance from Blend if buffer thin (design intent)

---

## 5) Auth & security model (judges love this)

### Employee
1. WebAuthn **register** / **authenticate** (UV required)  
2. Server verifies attestation/assertion  
3. Issues **HMAC session token** (Bearer)  
4. Credential record **sealed** client-side with server HMAC (no DB required on Vercel)  
5. **Withdraw always requires** employee session (no allowlist-only bypass)

### Employer / operator money actions
- Deposit / create stream / rebalance: **CSRF same-site** and/or **`X-YieldFlow-Admin-Key`**  
- **Mainnet requires admin key** for those money ops (stricter than testnet)

### Hardening already done
- CORS fail-closed when origin configured  
- Dedicated `YIELDFLOW_SESSION_SECRET` ≠ signer secret  
- Rate limits on auth, guide, money routes  
- AI guide refuses secret-exfil prompts  
- Employee allowlist (`YIELDFLOW_EMPLOYEE_ADDRESS` / allowlist)  
- Passkey RP_ID/ORIGIN bound to production domain  

### Honest MVP custody note
- Server holds **hot signer** for gasless employee UX and operator actions (demo/MVP)  
- Production hardening path: OpenZeppelin Relayer / multisig / user-signed txs / MPC — **not fully replaced yet**  
- Say: *“MVP prioritizes seamless passkey withdraw UX; custody decentralization is the next production milestone.”*

---

## 6) Contract error codes (know these)

### Streaming
| Code | Name | Meaning |
|------|------|---------|
| 1 | AlreadyInitialized | init twice |
| 2 | NotInitialized | missing config |
| 3 | InvalidAmount | amount ≤ 0 |
| 4 | InvalidSchedule | end ≤ start |
| 5 | StreamAlreadyExists | duplicate employee stream |
| 6 | **StreamNotFound** | no stream for employee (common pre-approve) |
| 7 | InsufficientUnlockedBalance | withdraw > unlocked |

### Vault (high-signal)
| Code | Name | Meaning |
|------|------|---------|
| 1 | AlreadyInitialized | |
| 2 | NotInitialized | |
| 3 | InvalidSplit | bps bad |
| 4 | InvalidAmount | |
| 5 | InsufficientBuffer | not enough liquid buffer |
| 6 | InsufficientYieldPrincipal | yield leg empty/short |

---

## 7) API surface (high level)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | network, contract IDs, security flags |
| GET | `/api/employer` | employer address + contracts |
| GET | `/api/stats` | vault pool, buffer, APY estimate, DeFindex ref |
| POST | `/api/deposit` | fund vault (admin/CSRF) |
| POST | `/api/stream/create` | authorize employee stream |
| GET | `/api/employee/balance` | unlocked/rate/cap (zeros if no stream) |
| POST | `/api/employee/passkey/*` | register/login WebAuthn |
| POST | `/api/withdraw` | passkey session → release buffer |
| POST | `/api/rebalance` | Blend → buffer |
| POST | `/api/guide` | AI product guide |
| GET | `/api/activity` | recent actions |

---

## 8) End-to-end happy path (demo script)

1. **Health check** → `stellar-mainnet`, contracts present, `blendEnabled`  
2. **Admin Console** unlock with admin key  
3. Ensure deployer has **USDC trustline + USDC balance** (XLM alone is not enough)  
4. **Deposit** small USDC (e.g. 5–10) → stats show pool + buffer + yield leg  
5. **Create stream** (Approvals or Admin) for demo employee  
6. **Employee passkey login** → balance > 0 unlocks over time  
7. **Withdraw** unlocked amount → on-chain tx hash  

If steps 3–5 skipped → dashboards correctly show **zeros**. That is expected, not a bug.

---

## 9) Likely judge questions + strong answers

### Product / thesis
**Q: Why streaming payroll instead of monthly batch?**  
A: Employees get continuous liquidity; employers keep idle payroll productive in DeFi instead of sitting in a checking account.

**Q: Who earns the yield — company or worker?**  
A: MVP routes yield at the **employer vault** level (treasury efficiency). Product can later share yield with workers via policy — not hard-coded as employee interest account yet.

**Q: What problem on Stellar specifically?**  
A: Cheap, fast settlement + SAC USDC + mature money market (Blend) makes second-level payroll economically viable vs high L2 gas chains.

### Architecture
**Q: Why two contracts (vault + streaming)?**  
A: Separation of concerns: vault = capital + yield + liquidity; streaming = HR schedule + unlock accounting. Vault calls streaming on withdrawal to keep ledgers consistent.

**Q: Why not put everything in one contract?**  
A: Upgradeability/reasoning clarity, auth boundaries (`employer` vs `withdrawal_controller`), and cleaner testing.

**Q: How do you prevent employees draining the yield leg?**  
A: Withdraw limited to **unlocked** stream amount and paid from **buffer**; yield leg is rebalanced intentionally, not freely withdrawn by employees.

**Q: What is buffer health?**  
A: Whether liquid buffer can cover near-term unlocks; rebalance pulls from Blend when buffer is stressed.

### Blend / DeFindex
**Q: Are you really using Blend or just mocking APY?**  
A: Vault has on-chain `set_blend_pool` + supply/withdraw via Blend `submit` request types. Stats read Blend positions/reserves. APY estimate uses reserve curve params when capital is supplied. **0% APY with empty vault is correct.**

**Q: Where does DeFindex fit if yield is direct Blend?**  
A: DeFindex is the **strategy vault abstraction** (fees, allocations, composability). We integrate it as live market reference and architecture target; payroll path is direct Blend for MVP reliability and gas/XLM budget.

**Q: Why FixedV2 pool?**  
A: Known mainnet USDC pool configuration suitable for supply-side yield with established liquidity.

### Auth
**Q: Is passkey real or UI fake?**  
A: Real WebAuthn via SimpleWebAuthn; UV required; server verifies; sealed credential + session HMAC.

**Q: Do you store biometrics?**  
A: No. Device authenticator holds private key; server stores only public credential material inside HMAC-sealed record / session.

**Q: Why server signer?**  
A: Gasless UX for employees and reliable Soroban auth for vault controller in hackathon MVP. Tradeoff is hot-key custody risk — mitigated by allowlist, admin key, rate limits; production moves to relayer/multisig.

**Q: Can anyone withdraw?**  
A: No. Withdraw requires valid **employee session** matching allowlisted employee; not just knowing the G address.

### Security attack questions
**Q: CSRF on deposit?**  
A: Mutations gated by CSRF cookie same-site or admin key; mainnet money ops require admin key.

**Q: XSS steal admin key?**  
A: Admin key is operator-entered into sessionStorage for console; not embedded in bundle. Still treat XSS as critical — CSP headers set on Vercel.

**Q: Replay passkey?**  
A: Challenge tokens are sealed with expiry; WebAuthn challenges are single-use ceremony.

**Q: Session secret rotation?**  
A: Old sealed credentials fail HMAC; client recovers by re-registering passkey.

**Q: Mainnet key leak?**  
A: Rotate signer, freeze allowlist, pause deposits, redeploy controller roles if needed. (Have this as incident plan.)

### Soroban / Stellar deep
**Q: How do you auth contract calls?**  
A: `require_auth` on employer for stream create / vault init; withdrawal_controller for release/record paths. Server signs as that account for MVP.

**Q: Simulation vs execution?**  
A: Read paths use `simulateTransaction`; writes simulate → assemble → sign → `sendTransaction` → poll status.

**Q: What about footprint / rent?**  
A: Persistent storage for config/stream/state; lean deploy kept wasm/init minimal due to XLM budget.

**Q: SAC vs classic trustlines?**  
A: USDC is Soroban token contract (SAC). Accounts interacting may still need classic trustline depending on path; operator must hold USDC.

### Product edge cases
**Q: Employee joins mid-period?**  
A: `create_stream(total, start, end)` defines schedule; mid-hire = new stream params.

**Q: Early termination?**  
A: MVP does not fully productize cancel/reassign; would add admin `close_stream` + final settlement.

**Q: Multi-employee?**  
A: Contract supports per-address streams; UI/API allowlist is single demo employee for MVP.

**Q: What if Blend utilization tanks APY?**  
A: APY is market-driven; buffer policy keeps payroll unlock liquid regardless of yield.

**Q: Oracle dependency?**  
A: Payroll unlock is **time-based**, not price-oracle based. Blend has its own internal market mechanics.

### Business / impact
**Q: Who is the customer?**  
A: Startups/DAOs/remote teams paying USDC on Stellar who want yield on idle payroll float.

**Q: Regulatory?**  
A: Non-custodial smart contracts + operator demo key today; production needs compliance review for wage payments by jurisdiction.

**Q: Moat?**  
A: Payroll-specific vault policy (buffer vs yield) + passkey employee UX + Stellar fee profile — not generic yield aggregator.

---

## 10) Trap questions — short truthful answers

| Trap | Answer |
|------|--------|
| “Show me non-zero yield now” | Vault empty → 0 is correct; deposit first |
| “Is this audited?” | No formal external audit yet; hardened MVP + known limitations |
| “Is AI on-chain?” | No — off-chain guide only |
| “Are you custodial?” | MVP operator signer is semi-custodial for UX; contracts themselves are non-custodial logic |
| “Mainnet real money?” | Contracts on mainnet; demo amounts should stay tiny; need real USDC |
| “Why APY 0?” | No principal in Blend yet / estimate floors at 0 |
| “Hardcoded employee?” | Demo allowlist uses deployer G address for smoke; multi-user is roadmap |
| “Testnet leftovers?” | UI copy may still say testnet in places; API health reports `stellar-mainnet` |

---

## 11) Repo map (if they ask “where is X?”)

| Path | What |
|------|------|
| `contracts/contracts/vault` | Vault + Blend integration |
| `contracts/contracts/streaming` | Streaming payroll math |
| `frontend/api/index.mjs` | Main API (chain + auth + guide) |
| `frontend/api/passkey-lib.mjs` | WebAuthn helpers |
| `frontend/api/security-lib.mjs` | CORS/CSRF/admin/rate limit |
| `frontend/src/sdk/*` | Browser SDK |
| `frontend/src/components/*` | Dragonfly-style UI |
| `deployments/mainnet.json` | Mainnet deployment record |
| `config/mainnet-usdc.json` | USDC/Blend/DeFindex catalog |
| `docs/SECURITY_HARDENING.md` | Security notes |
| `docs/MAINNET_READINESS.md` | Launch checklist |
| `docs/ADMIN_ACCESS.md` | Admin console usage |

---

## 12) Mainnet IDs cheat sheet

```
Network:        Public Global Stellar Network ; September 2015
Employer:       GB65HDYFWIUA3UMCWJ3WCERBTS2L7YWHFKXIPMLYRXWEZI53WL7GTSTL
Vault:          CCS5IUVU3KRHEDQJHLZZGULEFQAFLXDBEE2FTTBZAHFOXEVH7T4VJWXW
Streaming:      CBDQ2ZHNX5Q7KU6GF733UOXH72FGGRUD6DDHBNXTPGXDF4E75VN3GUQ6
USDC SAC:       CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
Blend FixedV2:  CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD
App:            https://yieldflow-frontend.vercel.app/
```

---

## 13) What the extra ~100 XLM is for

XLM is **ops fuel**, not payroll:
- Soroban inclusion fees / resource fees  
- Contract invoke costs (deposit, create_stream, rebalance, withdraw)  
- Safety margin if RPC retries or higher fees  

Still required separately:
- **Mainnet USDC** on deployer (with trustline) for deposits  
- Tiny demo amounts recommended for judging

**Suggested smoke budget (example):**
- Keep **≥ 20–30 XLM** free for fees  
- Deposit **2–10 USDC** payroll smoke (if available)  
- Stream **2–5 USDC / 30d** for visible per-second unlock  

---

## 14) 60-second verbal demo script

1. “YieldFlow streams payroll on Stellar while idle wages earn on Blend.”  
2. Open health: mainnet vault + streaming + Blend IDs.  
3. Employer vault: 15% buffer / 85% yield split.  
4. Employee: real passkey login (WebAuthn).  
5. Explain zeros = no deposit yet; walk deposit → stream → unlock → withdraw.  
6. Security: passkey session required for withdraw; admin key on mainnet money ops.  
7. Roadmap: multi-employee HR, relayer custody, full DeFindex deposit path, audit.

---

## 15) Roadmap if asked “what’s next?”

1. Funded mainnet smoke with tiny USDC  
2. Multi-employee allowlist + HR approvals productization  
3. Replace hot server signer with relayer / user wallet signatures  
4. Optional DeFindex deposit strategy hop  
5. Formal audit + monitoring / pause controls  
6. Yield-share policies (employer vs employee)

---

*Generated for YieldFlow judging prep. Keep secrets out of this file — admin keys, signer seeds, and AI keys stay in Vercel env / local gitignored files only.*
