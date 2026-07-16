# YieldFlow Contracts

Soroban/Stellar smart contract work will live here.

Planned contracts from `PLAN.md`:

- `streaming.rs`: timestamp-based employee salary accrual.
- `vault.rs`: employer deposits, buffer accounting, and withdrawal accounting.
- `defindex_router.rs`: DeFindex/Blend routing adapter.

Implementation notes from Stellar skills:

- Use `#![no_std]` and `soroban-sdk` types.
- Prefer `__constructor` for initialization.
- Use typed storage keys with `#[contracttype]`.
- Store per-user stream state in persistent storage and extend TTL in hot paths.
- Require auth at every layer that consumes an address authority.
- Use `i128` for token amounts and reject negative values.
- Use the Stellar Asset Contract for USDC instead of a custom token.
