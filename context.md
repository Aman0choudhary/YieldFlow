# YieldFlow Context

## Current Working Mode

- Aman is the blockchain/integration owner and primary technical driver.
- The 21-day timeline in `PLAN.md` is background only. We will build in the time available and prioritize a working MVP over calendar-perfect milestones.
- Aditiya, if involved, should remain frontend-only and should consume a plain JavaScript SDK or mock SDK.
- Codex should not implement or edit Aditiya/frontend work unless Aman explicitly asks.
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

## Implementation Principles

- Build from the SDK contract inward: define SDK types and mock responses first, then wire real blockchain behavior behind the same interface.
- Maintain the SDK boundary for frontend consumption, but do not build frontend UI in this workspace unless Aman explicitly asks.
- Keep contracts small, testable, and demo-focused.
- Prefer testnet-only assumptions for the MVP.
- Avoid building phase-2 features such as bank off-ramp, multi-tenant support, or mainnet hardening until the core demo works.
- Record important implementation choices here as they happen.

## Current Workspace State

- `PLAN.md` exists and contains the original project plan.
- `context.md` is the living build log and decision record.
- No valid git repository is currently initialized in this folder.
- The canonical GitHub `main` branch is the source of truth for the merged full product code.
- A clean local run copy exists at `.local-run-main/`; it contains the frontend plus live testnet bridge and is what localhost testing uses.
- `sdk/mock-sdk.js` contains the frontend-ready mock SDK.
- `sdk/yieldflow-sdk.js` contains the future real SDK surface with matching function names.
- `sdk/live-api-sdk.ts` is the frontend-facing SDK used by localhost to call the local live bridge.
- `docs/sdk-contract.md` documents the SDK response shapes.
- `scripts/check-sdk-contract.js` verifies the mock SDK returns the expected shape.
- The root workspace still does not have a normal valid `.git`; use the GitHub repo or `.local-run-main/` for git operations until the root folder is repaired/recloned.
- The frontend has been merged into GitHub `main` from Aditiya's branch and then connected to the live bridge after Aman explicitly asked to connect it.
- `contracts/` exists as a placeholder for Soroban contract work.
- `contracts/contracts/streaming` implements stream accounting and has unit tests.
- `contracts/contracts/vault` implements deposit split accounting and streaming-checked token releases.
- `scripts/setup-testnet-identity.ps1` creates/funds a Stellar testnet identity if needed.
- `scripts/deploy-testnet.ps1` builds, deploys, initializes both contracts, and writes `deployments/testnet.json`.
- `scripts/generate-bindings.ps1` regenerates TypeScript/JavaScript bindings from the latest WASMs.
- `scripts/deposit-payroll.ps1`, `scripts/create-demo-stream.ps1`, and `scripts/withdraw-demo.ps1` provide repeatable demo contract operations after deployment.
- `docs/deployment.md` documents local verification and testnet deployment flow.
- `sdk/generated/streaming` and `sdk/generated/vault` contain Stellar CLI-generated TypeScript bindings.
- Generated SDK package dependencies are installed and both generated packages build locally.
- `sdk/yieldflow-sdk.js` is now a configurable wrapper around those generated clients, with Passkey login still intentionally blocked.
- `config/testnet-usdc.json` contains the existing Circle Stellar testnet USDC asset and derived SAC address.
- `deployments/testnet.json` contains the deployed YieldFlow testnet contract IDs.
- `scripts/live-api-server.js` runs a local bridge from the frontend to the deployed testnet contracts through Stellar CLI.

## Current Product Status

- Backend contracts are deployed on Stellar testnet and live-smoke-tested.
- Frontend is connected locally to those deployed contracts through the Node/CLI bridge.
- Local demo URLs:
  - Frontend: `http://127.0.0.1:5173/`
  - Live API bridge: `http://127.0.0.1:8787/`
- The bridge uses the funded local Stellar CLI identity `yieldflow-deployer`; it is demo infrastructure, not production wallet/passkey signing.
- GitHub `main` has the live bridge commit: `a359deb Connect frontend to live testnet bridge`.
- Repository: `https://github.com/Aman0choudhary/YieldFlow`
- For SCF/judging, phrase the state as: working testnet MVP with live contracts and localhost frontend connected through a local bridge; production browser signing/passkey relayer and DeFindex/Blend yield routing are next milestones.

## Near-Term Build Order

1. Keep the local frontend/API bridge running for demo and judge review.
2. Repair/reclone the root workspace later so local files match GitHub `main` cleanly.
3. Replace the local CLI bridge with browser wallet/passkey signing once the hackathon demo needs a fully client-side transaction path.
4. Add relayer/passkey integration around the withdrawal entrypoint for gasless employee withdrawals.
5. Add DeFindex/Blend routing once a compatible testnet pool for the selected Circle USDC issuer is confirmed.

## Local Demo Commands

Run these from the clean local copy:

```powershell
cd C:\Users\amant\OneDrive\Documents\YeildFlow\.local-run-main
npm.cmd run api
```

In a second terminal:

```powershell
cd C:\Users\amant\OneDrive\Documents\YeildFlow\.local-run-main\frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Then open:

```txt
http://127.0.0.1:5173/
```

Useful live API checks:

```txt
http://127.0.0.1:8787/api/stats
http://127.0.0.1:8787/api/employee/balance?employeeId=GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4
```

## Testnet References

- Deployer/employer: `GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM`
- Employee test account: `GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4`
- USDC SAC: `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`
- Streaming contract: `CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU`
- Vault contract: `CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B`
- Deposit smoke tx: `f25f7d5cca33e4b87e24ad3034c97d1e60446f36f6b4b0170d1cf5700520635c`
- Stream creation smoke tx: `61ea40e6d8324b34c6ba1536f9ae0d391bc6ebfd0c9c0b4374df6b30b1e21e50`
- Withdrawal smoke tx: `d6c1765f2a3965c49a6cdecf3fd279ab7b14abbd858e237a1b564f07e3936632`
- Optimized streaming WASM hash: `f8a5b1c4bb4f47ed2c302b6845514b5643f9eafc48ece6aa150d97047a385ee4`, size `6738` bytes.
- Optimized vault WASM hash: `f3f1925f5f8306d3325c1b11e57d8ca8f82359648e3bc9d9789f288149cabaf8`, size `8919` bytes.

## Decision Log

- 2026-07-11: Aman said to ignore the strict 21-day schedule and proceed in whatever time is available.
- 2026-07-11: Added this `context.md` file to track approach, decisions, and changes side by side with implementation.
- 2026-07-11: Created the SDK-first foundation so frontend work can begin before blockchain integrations are complete.
- 2026-07-11: Chose plain async JavaScript functions returning JSON as the boundary between UI and blockchain work.
- 2026-07-11: Aman clarified that Codex should only do Aman's side of the work, not Aditiya/frontend work.
- 2026-07-11: Removed the accidental `frontend/` scaffold and locked future Codex scope to contracts, SDK, integrations, scripts, and docs.
- 2026-07-11: Initialized Stellar contract workspace using installed `stellar 26.0.0` CLI.
- 2026-07-11: Implemented `streaming` contract with one active stream per employee, live unlocked balance, and withdrawal accounting.
- 2026-07-11: Cargo initially resolved `ed25519-dalek 3.0.0`, which broke Soroban testutils; pinned the contract lockfile to `ed25519-dalek 2.2.0`.
- 2026-07-11: Implemented `vault` contract for payroll deposits, 15/85 buffer/yield accounting, controlled buffer release, and rebalance accounting.
- 2026-07-11: Connected `vault.release_buffer` to the streaming contract interface so token release records streamed withdrawal first.
- 2026-07-11: Verified `stellar contract build` produces deployable WASMs for `streaming` and `vault`.
- 2026-07-11: Added PowerShell scripts for testnet identity setup and two-contract deployment/initialization.
- 2026-07-11: Generated Stellar TypeScript bindings from local WASMs under `sdk/generated/`.
- 2026-07-11: Replaced the real SDK placeholder with a configurable wrapper around generated contract clients.
- 2026-07-11: Installed and built generated `vault` and `streaming` SDK packages; import smoke test for `sdk/yieldflow-sdk.js` passes.
- 2026-07-11: Added operational scripts for deposit, stream creation, and demo withdrawal against deployed contract ids.
- 2026-07-15: Verified existing Stellar testnet USDC asset activity, derived SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`, created test identities, and established employer/employee USDC trustlines.
- 2026-07-15: Circle faucet funding requires manual browser/reCAPTCHA action for `employer-test`.
- 2026-07-15: Blend testnet UI config uses a different USDC issuer than the requested Circle issuer, so no matching Blend testnet pool was confirmed for this asset.
- 2026-07-18: Deployed YieldFlow contracts to Stellar testnet using `yieldflow-deployer`.
- 2026-07-18: Fresh deployer/employer address is `GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM`.
- 2026-07-18: Streaming contract deployed at `CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU`.
- 2026-07-18: Vault contract deployed at `CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B`.
- 2026-07-18: Vault initialized with USDC SAC `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` and 15/85 buffer/yield split.
- 2026-07-18: Fixed `scripts/deploy-testnet.ps1` address parsing for Stellar CLI 26 output.
- 2026-07-18: Added USDC trustline for the fresh deployer/employer; balance is currently `0`, so Circle faucet funding is still needed before a live deposit smoke test.
- 2026-07-18: Circle faucet funded the deployer/employer with `20 USDC`.
- 2026-07-18: Live testnet smoke deposit succeeded for `10 USDC`; vault state became `1.5 USDC` buffer and `8.5 USDC` yield principal. Transaction: `f25f7d5cca33e4b87e24ad3034c97d1e60446f36f6b4b0170d1cf5700520635c`.
- 2026-07-18: Created a live `5 USDC` employee stream over 1 day for `GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4`. Transaction: `61ea40e6d8324b34c6ba1536f9ae0d391bc6ebfd0c9c0b4374df6b30b1e21e50`.
- 2026-07-18: Live withdrawal smoke test succeeded for `0.0001 USDC`; vault released `1000` base units, streaming recorded `withdrawn_amount=1000`, and employee USDC balance became `1000` base units. Transaction: `d6c1765f2a3965c49a6cdecf3fd279ab7b14abbd858e237a1b564f07e3936632`.
- 2026-07-18: Connected the localhost frontend to the live testnet backend through `scripts/live-api-server.js` and `sdk/live-api-sdk.ts`. This is a local demo bridge that uses the funded CLI identity; production browser signing still needs Freighter/passkey integration.
- 2026-07-18: Pushed live frontend/backend bridge to GitHub `main` in commit `a359deb`.
- 2026-07-19: Prepared SCF application wording: describe YieldFlow as a working Stellar/Soroban testnet MVP for payroll streaming, with live testnet contracts, existing Stellar testnet USDC, localhost frontend connected through a local bridge, and future milestones of wallet/passkey signing, relayer flow, and DeFindex/Blend yield routing.
- 2026-07-21: Ran `stellar contract build --optimize` for Mainnet Grants readiness. Streaming WASM optimized from `7995` to `6738` bytes; vault WASM optimized from `10475` to `8919` bytes.

## Decoupled Vercel Deployments (2026-07-21)

- We decoupled the frontend and backend into two separate, self-contained Vercel projects for a true MVP architecture.
- **Backend (`backend/`)**: Deployed as a serverless function to `https://yieldflow-backend.vercel.app`. It directly queries Soroban RPC via `@stellar/stellar-sdk` and handles transaction simulation, submission, and status polling without relying on generated file-system SDK bindings.
- **Frontend (`frontend/`)**: Deployed to `https://yieldflow-frontend.vercel.app`. Rewrote the SDK at `frontend/src/sdk/yieldflow-sdk.ts` to replace mock data with `fetch()` calls to the backend's API endpoints.
- Environment: Frontend passes `VITE_API_URL` pointing to the backend. Backend uses `YIELDFLOW_SIGNER_SECRET` for state-changing deposits and withdrawals.
- **Contract Optimizations**: Ran `stellar contract build --optimize` for Mainnet Grants readiness. Streaming WASM optimized to `6738` bytes; vault WASM optimized to `8919` bytes. This ensures extremely low deployment costs (estimated at ~5 XLM per contract to be safe).
