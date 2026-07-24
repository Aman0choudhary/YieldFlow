# Deployment Notes

These commands are Aman-side only and use the installed `stellar 26.0.0` CLI.

## 1. Verify Contracts Locally

```powershell
Set-Location .\contracts
cargo test
stellar contract build
```

The build outputs are:

- `contracts/target/wasm32v1-none/release/streaming.wasm`
- `contracts/target/wasm32v1-none/release/vault.wasm`

## 2. Create A Testnet Identity

```powershell
.\scripts\setup-testnet-identity.ps1 -Name yieldflow-admin
```

This creates and funds the identity only if it does not already exist.

## 3. Deploy Contracts

The deploy script expects a token contract id. For now, pass a testnet Stellar Asset Contract id for the USDC-like token you want the MVP to use.

```powershell
.\scripts\deploy-testnet.ps1 `
  -SourceAccount yieldflow-admin `
  -TokenContractId CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

The script:

1. Builds both contracts.
2. Deploys `streaming`.
3. Deploys `vault`.
4. Initializes `streaming` with the vault as withdrawal controller.
5. Initializes `vault` with the employer, streaming contract, token, and 15/85 split.
6. Writes deployment output to `deployments/testnet.json`.

## Current Withdrawal Shape

`vault.release_buffer(employee, amount)` checks the streaming contract first by calling `streaming.record_withdrawal(employee, amount)`. If streaming says the amount is not unlocked yet, no token transfer happens.

The vault-level `withdrawal_controller` is currently the deployer account. Later, this should become the relayer-controlled address or contract used by the gasless withdrawal flow.

## Demo Operations

After `deployments/testnet.json` exists, these helpers call the deployed contracts:

```powershell
.\scripts\deposit-payroll.ps1 -Amount 10000

.\scripts\create-demo-stream.ps1 `
  -Employee GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
  -TotalAmount 3000 `
  -DurationDays 30

.\scripts\withdraw-demo.ps1 `
  -Employee GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX `
  -Amount 5
```

Amounts are human USDC values and are converted to 7-decimal token units before contract invocation.


## Mainnet

See [MAINNET_READINESS.md](./MAINNET_READINESS.md). Do not deploy mainnet until explicitly approved.

