# Phase 3 — Stellar swap runbook (YieldFlow Plan v2)

Goal: replace mock settlement without rewriting the React UI.

## Preconditions

- [ ] `stellar` CLI + funded testnet identity
- [ ] Contracts built (`contracts/contracts/vault`, `contracts/contracts/streaming`)
- [ ] Circle testnet USDC available (see `config/testnet-usdc.json`)

## Steps

1. **Deploy**
   ```powershell
   npm run deploy:testnet
   ```
   Record contract IDs into `deployments/testnet.json`:
   ```json
   {
     "contracts": {
       "vault": "C...",
       "streaming": "C...",
       "defindex_router": null
     }
   }
   ```

2. **Env / build injection**
   - Vite reads `deployments/testnet.json` automatically, or set:
     - `VITE_VAULT_CONTRACT_ID`
     - `VITE_STREAMING_CONTRACT_ID`
     - `VITE_SOURCE_PUBLIC_KEY`
   - Mode:
     ```powershell
     $env:VITE_YIELDFLOW_SDK="stellar"
     npm --prefix frontend run dev
     ```

3. **Live client bridge**
   - Aman path: `sdk/yieldflow-sdk.chain.js` + generated clients under `sdk/generated/*`
   - Frontend path: `sdk/yieldflow-sdk.ts` → `stellar-sdk.ts` when contracts configured
   - UI imports only `frontend/src/sdk/yieldflow-sdk.ts`

4. **Wallet signer**
   - Provide `signTransaction` to the chain SDK configure path
   - Until signer exists, stellar-mode money writes should fail clearly (Journey D)

5. **Verify**
   ```powershell
   npm run verify:demo
   npm --prefix frontend run build
   ```
   - Deposit/withdraw produce explorer-openable hashes
   - Failure states remain recoverable in UI

## Exit criteria (Plan v2 Phase 3)

- [ ] UI unchanged except data source
- [ ] Real tx hashes open in explorer
- [ ] Failure states still handled
- [ ] Mock remains default for demos without keys

## Fallback

Keep `VITE_YIELDFLOW_SDK=mock` for judges / offline demos.
