# Combined Frontend + API on Vercel

The public demo URL is fixed:

```txt
https://yieldflow-frontend.vercel.app/
```

Backend API routes are served from the **same** Vercel project under `/api/*` so the browser does not need a second domain.

## Layout

```txt
frontend/
  api/
    index.mjs           # /api
    [[...slug]].mjs     # /api/*
  src/                  # React app
  vercel.json
  package.json          # includes @stellar/stellar-sdk
```

The React SDK uses `VITE_API_URL` when set, otherwise same-origin `/api/...`.

## Deploy

```powershell
# optional, enables Fund payroll / Withdraw
$env:YIELDFLOW_SIGNER_SECRET = "S...."   # yieldflow-deployer secret (testnet only)

powershell -ExecutionPolicy Bypass -File .\scripts\deploy-frontend-vercel.ps1
```

Or manually from `frontend/`:

```powershell
cd frontend
npm install
npx vercel login
npx vercel link --project yieldflow-frontend
npx vercel deploy --prod --yes
```

## Required Vercel env (Production)

| Name | Value |
|------|--------|
| `YIELDFLOW_ALLOWED_ORIGIN` | `https://yieldflow-frontend.vercel.app` |
| `YIELDFLOW_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `YIELDFLOW_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `YIELDFLOW_PUBLIC_KEY` | `GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM` |
| `YIELDFLOW_VAULT_CONTRACT_ID` | `CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B` |
| `YIELDFLOW_STREAMING_CONTRACT_ID` | `CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU` |
| `YIELDFLOW_EMPLOYEE_ADDRESS` | `GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4` |
| `YIELDFLOW_SIGNER_SECRET` | testnet secret for deployer (deposit/withdraw) |

Do **not** set `VITE_API_URL` for this combined deploy.

## Smoke checks

```txt
https://yieldflow-frontend.vercel.app/api/health
https://yieldflow-frontend.vercel.app/api/stats
https://yieldflow-frontend.vercel.app/api/employer
```
