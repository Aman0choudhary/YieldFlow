# Contracts

Soroban contracts live here.

## Workspace crates (Aman / CLI path)

MVP contracts under the Cargo workspace:

- `contracts/streaming`: employee stream accounting and unlocked balance calculation.
- `contracts/vault`: employer deposits, buffer allocation, yield allocation accounting, and controlled buffer releases.
- `contracts/defindex_router` (planned / scaffold): DeFindex and Blend routing once the core vault is stable.

The first implementation target is the SDK contract documented in `docs/sdk-contract.md`.

### Commands

```sh
cargo test
stellar contract build
```

See also `docs/deployment.md` and `scripts/deploy-testnet.ps1`.

## Frontend-facing scaffolds (Phase 3 readiness)

Additional scaffold modules may exist at:

| Crate | Path | Role |
|-------|------|------|
| `streaming` | `contracts/streaming/src/lib.rs` or workspace path above | Salary accrual + withdraw |
| `vault` | `contracts/vault/src/lib.rs` or workspace path above | Deposits, buffer/yield bps, pool accounting |
| `defindex_router` | `contracts/defindex_router/src/lib.rs` | Yield routing adapter |

These are **not** live RPC yet. The frontend continues to import only the SDK (mock by default).

## Mock to real swap path

1. Deploy contracts to testnet (`npm run deploy:testnet` / `scripts/deploy-testnet.ps1`).
2. Write IDs into `deployments/testnet.json`, `config/testnet-usdc.json`, and `sdk/config.ts`.
3. Implement RPC invokes in `sdk/stellar-sdk.ts` / `sdk/yieldflow-sdk.chain.js` (same exports as mock).
4. Set `VITE_YIELDFLOW_SDK=stellar` for the Vite UI and rebuild.
5. Keep lifecycle states identical for UI: `submitted | pending | confirmed | failed`.
6. Passkey / smart account stays inside the SDK with mock fallback for demos.

## Notes

- Prefer `__constructor` for initialization.
- Typed storage keys with `#[contracttype]`.
- Auth at every authority layer.
- `i128` amounts; reject negatives.
- USDC via Stellar Asset Contract (not a custom token).
