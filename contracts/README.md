# Contracts

Soroban contracts will live here.

MVP contracts:

- `contracts/streaming`: employee stream accounting and unlocked balance calculation.
- `contracts/vault`: employer deposits, buffer allocation, yield allocation accounting, and controlled buffer releases.
- `contracts/defindex_router`: DeFindex and Blend routing once the core vault is stable.

The first implementation target is the SDK contract documented in `docs/sdk-contract.md`.

## Commands

```sh
cargo test
stellar contract build
```
