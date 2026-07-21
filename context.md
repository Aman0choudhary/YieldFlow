# YieldFlow Context

## Current Working Mode

- Aman is the blockchain/integration owner and primary technical driver.
- The 21-day timeline in `PLAN.md` is background only. We will build in the time available and prioritize a working MVP over calendar-perfect milestones.
- Aditiya owns frontend work and should consume a plain JavaScript / TypeScript SDK or mock SDK.
- Codex should not implement or edit Aditiya/frontend work unless Aman explicitly asks (frontend branch work below was done on `frontend-aditya` by request).
- If there is confusion or a decision that affects product direction, security, money movement, or team ownership, ask Aman before changing course.

## Product Goal

YieldFlow streams salaries to employees over time while allowing employers to earn DeFi yield on payroll funds that have not yet streamed.

The MVP should prove this flow:

1. Employer deposits test USDC.
2. Vault splits funds between a liquid buffer and yield allocation.
3. Employee balance unlocks over time.
4. Employee logs in with passkey-based auth.
5. Employee withdraws unlocked funds without paying gas.
6. Employer can see pool, yield, and buffer status.

## Architecture Approach

The most important boundary is the SDK bridge layer.

Frontend code should call normal JavaScript functions and receive normal JSON. It should not need to understand Soroban, Stellar, Passkey Kit, DeFindex, Blend, or relayers.

Target SDK shape:

```js
sdk.connectEmployer()
sdk.depositPayroll(amount)
sdk.getEmployerStats()
sdk.loginEmployee()
sdk.getEmployeeBalance(id)
sdk.withdraw(id)
```

Frontend TypeScript demo path (mock-first) also exposes activity / preview / stream physics helpers via `sdk/yieldflow-sdk.ts` with mode `VITE_YIELDFLOW_SDK=mock|stellar`.

## Implementation Principles

- Build from the SDK contract inward: define SDK types and mock responses first, then wire real blockchain behavior behind the same interface.
- Keep contracts small, testable, and demo-focused.
- Prefer testnet-only assumptions for the MVP.
- Avoid building phase-2 features such as bank off-ramp, multi-tenant support, or mainnet hardening until the core demo works.
- Record important implementation choices here as they happen.
- Frontend tab ownership: Dashboard = health, Flows = operate pipeline, Activity = audit ledger.

## Current Workspace State

- `PLAN.md` exists and contains the original project plan.
- `context.md` is the living build log and decision record.
- `sdk/mock-sdk.js` / `sdk/mock-sdk.ts` contain frontend-ready mock SDK surfaces.
- `sdk/yieldflow-sdk.chain.js` is a configurable wrapper around generated contract clients (Aman path).
- `sdk/yieldflow-sdk.ts` is the Vite frontend entry with mock/stellar mode switch.
- `docs/sdk-contract.md` documents the SDK response shapes and mode selection.
- `scripts/check-sdk-contract.js` verifies the mock SDK returns the expected shape.
- `frontend/` is the YieldFlow demo UI (Vite + React + TypeScript) on branch `frontend-aditya`.
- `contracts/` holds the Soroban workspace (`contracts/contracts/streaming`, `contracts/contracts/vault`) plus additional Phase 3 scaffold crates where present.
- `scripts/setup-testnet-identity.ps1` creates/funds a Stellar testnet identity if needed.
- `scripts/deploy-testnet.ps1` builds/deploys contracts when stellar CLI is available.
- `scripts/generate-bindings.ps1` regenerates TypeScript/JavaScript bindings from the latest WASMs.
- `scripts/deposit-payroll.ps1`, `scripts/create-demo-stream.ps1`, and `scripts/withdraw-demo.ps1` provide repeatable demo contract operations after deployment.
- `docs/deployment.md` documents local verification and testnet deployment flow.
- `sdk/generated/streaming` and `sdk/generated/vault` contain Stellar CLI-generated TypeScript bindings.
- `config/testnet-usdc.json` contains the existing Circle Stellar testnet USDC asset and derived SAC address.
- `deployments/testnet.json` records deployed contract IDs when available.

## Near-Term Build Order

1. Scaffold / harden Soroban contracts (streaming + vault).
2. Add relayer/passkey integration around the withdrawal entrypoint.
3. Add DeFindex/Blend routing once the local vault primitive is stable.
4. Decide the browser/passkey signing shape for the final frontend-facing SDK.
5. Deploy to testnet once Aman chooses/provides the token contract id.
6. Point `VITE_YIELDFLOW_SDK=stellar` at live RPC once contract IDs are written into config.

## Decision Log

- 2026-07-11: Aman said to ignore the strict 21-day schedule and proceed in whatever time is available.
- 2026-07-11: Added this `context.md` file to track approach, decisions, and changes side by side with implementation.
- 2026-07-11: Created the SDK-first foundation so frontend work can begin before blockchain integrations are complete.
- 2026-07-11: Chose plain async JavaScript functions returning JSON as the boundary between UI and blockchain work.
- 2026-07-11: Aman clarified that Codex should only do Aman's side of the work, not Aditiya/frontend work (unless explicitly requested).
- 2026-07-11: Initialized Stellar contract workspace using installed `stellar 26.0.0` CLI.
- 2026-07-11: Implemented `streaming` contract with one active stream per employee, live unlocked balance, and withdrawal accounting.
- 2026-07-11: Cargo initially resolved `ed25519-dalek 3.0.0`, which broke Soroban testutils; pinned the contract lockfile to `ed25519-dalek 2.2.0`.
- 2026-07-11: Implemented `vault` contract for payroll deposits, 15/85 buffer/yield accounting, controlled buffer release, and rebalance accounting.
- 2026-07-11: Connected `vault.release_buffer` to the streaming contract interface so token release records streamed withdrawal first.
- 2026-07-11: Verified `stellar contract build` produces deployable WASMs for `streaming` and `vault`.
- 2026-07-11: Added PowerShell scripts for testnet identity setup and two-contract deployment/initialization.
- 2026-07-11: Generated Stellar TypeScript bindings from local WASMs under `sdk/generated/`.
- 2026-07-11: Replaced the real SDK placeholder with a configurable wrapper around generated contract clients.
- 2026-07-11: Installed and built generated `vault` and `streaming` SDK packages; import smoke test for `sdk/yieldflow-sdk.chain.js` passes.
- 2026-07-11: Added operational scripts for deposit, stream creation, and demo withdrawal against deployed contract ids.
- 2026-07-15: Verified existing Stellar testnet USDC asset activity, derived SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`, created test identities, and established employer/employee USDC trustlines.
- 2026-07-15: Circle faucet funding requires manual browser/reCAPTCHA action for `employer-test`.
- 2026-07-15: Blend testnet UI config uses a different USDC issuer than the requested Circle issuer, so no matching Blend testnet pool was confirmed for this asset.

---

## Frontend branch log (`frontend-aditya`)

### 2026-07-17 — UI animations + alignment polish

- Integrated premium motion/microinteractions without redesigning layout.
- Files: `frontend/src/App.tsx`, `frontend/src/animation-utils.ts`, `frontend/src/styles.css`.
- Verify: `npm --prefix frontend run build` passed.

### 2026-07-19 — Multi-page Dashboard / Flows / Activity

- Wired top nav to real page state for Dashboard / Flows / Activity.
- Files: `frontend/src/App.tsx`, `frontend/src/styles.css`.

### 2026-07-21 — Phase 0a + 0: extraction & IA cleanup

- Shell `App.tsx` + hooks + page components; exclusive tab ownership; hash routes; a11y basics.
- Files: `frontend/src/App.tsx`, pages, hooks, styles.

### 2026-07-21 — Phase 1 & 2: Flows/Activity depth + trust UI

- Confirm dialog, activity ledger polish, status badges, fund wizard, hop timeline, detail drawer, CSV export.
- Activity integrity: SDK is source of truth; UI reloads via `getActivity`; no duplicate confirm rows.
- Receipt dialog after deposit/withdraw submit.

### 2026-07-21 — Phase 3 readiness + Phase 4 polish

- `sdk/config.ts`, stellar mode surface, mock/stellar swap with fallback.
- Contract scaffolds + deploy/verify/demo-reset scripts.
- Health strip, settings panel with demo reset, Escape/a11y polish.
- Build: `npm --prefix frontend run build` passes.
- Structural: `npm run verify:demo` passes.
- Default runtime remains **mock** until contract IDs + RPC are live.

---

## 2026-07-21 — Full PRD phase execution pass

### Phases 0–2 (product)
- Dashboard treasury breakdown (Available / Streaming / Locked / Yield)
- Animated KPI metric cards
- Flows employer savings framing + illustrative monthly yield
- Keyboard shortcuts: 1/2/3 tabs, ? settings, Esc overlays
- Settings keyboard help copy

### Phase 3 (Stellar readiness)
- `sdk/config.ts` reads `VITE_VAULT_CONTRACT_ID`, `VITE_STREAMING_CONTRACT_ID`, etc.
- `sdk/stellar-sdk.ts` maps frontend string domain to optional live `yieldflow-sdk.chain.js` clients; graceful failed writes without signer; activity helpers retained
- Vite env defines for contract IDs

### Phase 4
- Deferred domain expansions not built (analytics suite, AI, RBAC, heatmap)
- Lightweight keyboard navigation polish only

### Verification
- Run `npm --prefix frontend run build`
- Default remains mock (`VITE_YIELDFLOW_SDK=mock`)

