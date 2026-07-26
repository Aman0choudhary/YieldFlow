# Contracts

Soroban smart contracts for YieldFlow.

## MVP contracts

| Crate | Role |
|-------|------|
| `contracts/streaming` | Employee stream accounting and unlocked balance calculation |
| `contracts/vault` | Employer deposits, 15/85 buffer-yield split, Blend supply, buffer releases, rebalance |

Architecture and API context: [`docs/TECH_STACK.md`](../docs/TECH_STACK.md).

## Commands

```sh
cargo test
stellar contract build
```

Optimized WASM outputs:

- `target/wasm32v1-none/release/streaming.wasm`
- `target/wasm32v1-none/release/vault.wasm`

(from the `contracts/` workspace root after `stellar contract build`)
