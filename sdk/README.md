# YieldFlow SDK

This folder is Aman-owned. It is the bridge between blockchain complexity and the frontend contract.

## Files

- `mock-sdk.js`: stable mock API for UI work.
- `yieldflow-sdk.chain.js`: real SDK wrapper around generated Stellar contract clients.
- `generated/streaming`: generated TypeScript package for the streaming contract.
- `generated/vault`: generated TypeScript package for the vault contract.

## Regenerate Bindings

```powershell
.\scripts\generate-bindings.ps1
```

## Build Generated Clients

Each generated package has its own dependencies:

```powershell
Set-Location .\sdk\generated\streaming
npm.cmd install
npm.cmd run build

Set-Location ..\vault
npm.cmd install
npm.cmd run build
```

## Configure Real SDK

```js
import sdk from "./yieldflow-sdk.chain.js";

await sdk.configureYieldFlowSdk({
  rpcUrl: "https://soroban-testnet.stellar.org",
  sourcePublicKey: "G...",
  signTransaction,
  contractIds: {
    streaming: "C...",
    vault: "C..."
  }
});

const stats = await sdk.getEmployerStats();
```

`loginEmployee()` is intentionally still blocked until Passkey Kit integration is chosen.
