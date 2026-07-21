# YieldFlow Scripts

Deployment, testnet setup, demo reset, and later relayer setup scripts.

## Available

| Script | Purpose |
|--------|---------|
| `demo-reset.ps1` | Print/clear browser demo keys + reseed instructions |
| `deploy-testnet.ps1` | Placeholder deploy steps for Soroban contracts |
| `verify-demo.ps1` | Print demo URLs, mock mode, and planned contract IDs |

## npm shortcuts (repo root)

```bash
npm run demo:reset
npm run deploy:testnet
npm run verify:demo
```

## Browser demo reset

The mock SDK exposes `resetDemo()` and the UI Settings panel calls it. That clears:

- `yieldflow.employeeId`
- `yieldflow.depositCount`
- `yieldflow.totalPool`
- `yieldflow.activityLog`

Alternatively hard-refresh after clearing site localStorage.
