# YieldFlow — Project Execution Plan

**Team:** Aman (Contracts, Integrations, Blockchain Engine) · Aditiya (Frontend UI only — no blockchain required)
**Timeline:** 21-Day Build Station
**Stack:** Soroban · DeFindex · Blend · Passkey Kit · OpenZeppelin Relayer · React

---

## 1. One-Liner

YieldFlow streams salaries to employees second-by-second while employers earn DeFi yield on unstreamed payroll — gasless, passkey-based withdrawals, no seed phrases.

---

## 2. System Architecture (recap)

```
Employer deposits USDC (monthly)
        │
        ▼
  Vault Contract (Soroban)
        │
        ├── ~85% ──► DeFindex ──► Blend lending pool (earns yield → employer)
        │
        └── ~15% ──► Liquidity Buffer (instantly withdrawable, covers near-term streaming)
        │
        ▼
  Streaming Balance (unlocks per employee, ~every 5 sec)
        │
        ▼
  Employee withdraws (Passkey auth + OpenZeppelin Relayer = gasless)
        │
        ▼
  Employee wallet (USDC)
```

---

## 3. The Key Design Decision: A Bridge Layer

Since Aditiya isn't deep into blockchain yet, the whole plan hinges on one thing: **Aman builds a plain JavaScript SDK that hides all blockchain complexity behind normal function calls.** Aditiya never touches Soroban, Stellar, Passkey Kit, or the Relayer directly — he just calls functions like `sdk.getBalance()` the same way he'd call any REST API, and gets back normal JSON.

```js
// yieldflow-sdk.js — the ONLY file Aditiya needs to understand
sdk.connectEmployer()          // returns { address }
sdk.depositPayroll(amount)     // returns { txId, status }
sdk.getEmployerStats()         // returns { totalPool, yieldEarned, bufferStatus }
sdk.loginEmployee()            // Passkey FaceID/TouchID prompt → returns { employeeId }
sdk.getEmployeeBalance(id)     // returns { unlockedAmount, ratePerSecond }
sdk.withdraw(id)               // gasless withdraw → returns { txId, amountReceived }
```

Aman builds this SDK function-by-function as each contract/integration piece is finished. Aditiya starts building UI against a **mocked version** of this exact same SDK from Day 1 — same function names, fake data — so he's never blocked waiting on Aman, and never needs to learn blockchain to be productive.

---

## 4. Repo Structure

```
yieldflow/
├── contracts/                 # Soroban smart contracts — Aman
│   ├── streaming.rs
│   ├── vault.rs
│   ├── defindex_router.rs
│   └── tests/
├── sdk/
│   ├── yieldflow-sdk.js       # Aman builds real version, Aditiya uses mock version
│   └── mock-sdk.js            # fake data, same function signatures — Aditiya's Week 1 dependency
├── frontend/                  # React app — Aditiya, 100% blockchain-free
│   ├── src/employer/
│   ├── src/employee/
│   └── src/auth/              # just calls sdk.loginEmployee(), no Passkey internals here
├── scripts/                   # deploy + testnet setup — Aman
└── docs/
```

---

## 5. Ownership Split

**Aman — everything that touches blockchain (the hard, heavy half)**
- All Soroban contracts: streaming logic, vault, buffer split
- DeFindex + Blend integration and yield routing
- Passkey Kit integration (the actual auth/wallet logic, not the login screen)
- OpenZeppelin Relayer integration for gasless withdrawals
- Writing and maintaining `yieldflow-sdk.js` — the bridge layer
- All testnet deployment, contract testing, debugging

**Aditiya — frontend UI only, zero blockchain required**
- React app: layout, styling, routing, responsive design
- Employer dashboard (pool total, yield earned, buffer status) — calls SDK functions
- Employee view (balance ticking up, withdraw button) — calls SDK functions
- Login screen UI (button that calls `sdk.loginEmployee()` — Passkey prompt is handled inside the SDK, Aditiya just shows a loading state and success/fail screen)
- Polish: animations, loading states, error messages, demo-day visual polish

This means Aditiya can be fully productive from Day 1 without knowing what Soroban or Stellar even are — he's just building a normal React app against an API.

---

## 6. Day-by-Day Plan

### Week 1 — Contracts Foundation + UI Buildout in Parallel (Days 1–7)

| Day | Aman (blockchain) | Aditiya (frontend only) |
|---|---|---|
| 1 | **Together:** lock the SDK function list + exact mock JSON shapes for each function — this is the contract between you two | Same — this is the only blockchain-adjacent conversation Aditiya needs |
| 2–3 | Write `streaming.rs`: per-employee time-elapsed balance calc | Build React app skeleton + employer dashboard layout, wired to `mock-sdk.js` |
| 4–5 | Write `vault.rs`: deposit handling, buffer/yield split logic | Build employee balance screen, withdraw button UI (still mocked) |
| 6–7 | Unit test streaming + buffer, deploy v1 to testnet | Login screen UI, loading/error states, responsive polish (still mocked) |

### Week 2 — Yield Engine + SDK Wiring (Days 8–14)

| Day | Aman (blockchain) | Aditiya (frontend only) |
|---|---|---|
| 8–9 | DeFindex → Blend routing, keeper rebalance logic | Continue UI polish, build employer "yield earned" chart/visual (still mocked) |
| 10–11 | Write real `yieldflow-sdk.js` functions wrapping the deposit/balance contract calls | Fix any UI edge cases found from testing against mock SDK's variety of responses |
| 12 | **Together:** swap Aditiya's `mock-sdk.js` import for the real `yieldflow-sdk.js` — first live integration test | Same |
| 13–14 | Fix contract bugs / edge cases surfaced by real integration (double-withdraw guard, race conditions) | Fix UI issues caused by real data shapes/timing (no blockchain debugging needed — just JS/UI bugs) |

### Week 3 — Auth, Gasless Withdraw, Demo Prep (Days 15–21)

| Day | Aman (blockchain) | Aditiya (frontend only) |
|---|---|---|
| 15–16 | Integrate Passkey Kit, wrap into `sdk.loginEmployee()` | Build/finalize login screen calling the now-real `sdk.loginEmployee()` |
| 17–18 | Integrate OpenZeppelin Relayer, wrap into `sdk.withdraw()` | Finalize withdraw button + success animation calling real `sdk.withdraw()` |
| 19 | **Together:** full end-to-end demo run, fix remaining bugs | Same |
| 20 | **Together:** record demo video, finalize deck, rehearse interview answers | Same |
| 21 | **Together:** buffer day, submission | Same |

---

## 7. Definition of Done (MVP Demo)

- [ ] Employer can deposit test USDC into the vault on testnet
- [ ] Vault correctly splits deposit into buffer (~15%) and Blend-routed yield portion (~85%)
- [ ] Employee balance visibly increases in near-real-time (every ~5 sec) in the UI
- [ ] Employee can log in with a passkey (no seed phrase entry anywhere in the flow)
- [ ] Employee can withdraw their unlocked balance and pay zero gas
- [ ] Employer dashboard shows live yield accrued and buffer status
- [ ] Full flow works end-to-end in one uninterrupted demo take

---

## 8. Explicitly Out of Scope for 21 Days

- UPI Bridge / bank off-ramp (SEP-24 anchor) — Phase 2 roadmap only, mention in pitch, don't build
- Mainnet deployment — testnet only
- Formal security audit — note as a pre-launch requirement, not a hackathon deliverable
- Multi-employer / multi-tenant support — single employer flow is enough for the demo

---

## 9. Working With a Coding Agent

- **Aman's agent sessions:** work in the `contracts/` and `sdk/` folders only. Feed it the SDK function signatures from Section 3 as the target interface it's building toward.
- **Aditiya's agent sessions:** work in `frontend/` only, importing from `mock-sdk.js` (then later the real one). Never needs blockchain context in its prompts at all — just "build a React dashboard that calls these functions and displays this data."
- Lock the SDK function signatures on Day 1 and don't change them without telling the other person — that's the contract holding the parallel work together.
- Commit after every working checkpoint, not just end of day.
- At Day 12 (integration swap) and Day 19 (full run-through), work in the same room/call — that's when both halves need to be debugged together.

---

## 10. Risks & Mitigations (recap)

| Risk | Mitigation |
|---|---|
| Smart contract bug / exploit | Use audited, established protocols (DeFindex/Blend) instead of custom financial logic; cap yield exposure via buffer |
| Borrower default on Blend | Over-collateralized lending + Blend's backstop insurance module absorb losses before lenders do |
| Buffer runs dry under heavy withdrawals | Keeper function rebalances from Blend back into buffer on a threshold |
| SDK interface changes mid-build breaks frontend | Lock signatures Day 1, treat changes as a breaking-change conversation, not a silent edit |
| 21-day timeline slip | UPI Bridge and all "nice-to-haves" are explicitly cut — MVP is the 4-primitive core only |
