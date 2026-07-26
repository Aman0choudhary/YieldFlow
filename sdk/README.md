# YieldFlow SDK

Bridge between Soroban contracts and app layers.

## Layout

- `generated/streaming` — generated TypeScript client for the streaming contract
- `generated/vault` — generated TypeScript client for the vault contract
- Browser-facing SDK used by the app lives in `frontend/src/sdk/`

Full product architecture: [`docs/TECH_STACK.md`](../docs/TECH_STACK.md).

## Regenerate bindings

```powershell
.\scripts\generate-bindings.ps1
```

## Build generated clients

```powershell
Set-Location .\sdk\generated\streaming
npm.cmd install
npm.cmd run build

Set-Location ..\vault
npm.cmd install
npm.cmd run build
```
