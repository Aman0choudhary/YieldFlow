# YieldFlow Testnet — Manual Steps (NO MAINNET)

## What is live right now

| Piece | Value |
|------|--------|
| Network | Stellar **testnet only** |
| Vault | `CDVT3Y47BTCZ2GLV4JJQTPGGFPJEXXM4BRJLLQIEZRVKRCNPO3M7CBVX` |
| Streaming | `CCF4CYV2K7EVOP46UU7ZLS7Z3LEZKT5OIVCOQPGK6DKW7RWGUW6SESOS` |
| Blend pool | `CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW` |
| USDC SAC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` (Circle testnet) |
| Employer/signer | `GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM` |
| Employee | `GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4` |
| Demo stream | **50 USDC / 30 days** (already created) |
| Vault funding | **4 USDC** deposited → **15% buffer** + **85% supplied to Blend** (verified on-chain) |

### Proven on-chain
- Deposit splits buffer/yield
- Yield leg **actually supplies Circle USDC into Blend** (`supply` events)
- Stats API reads Blend positions + estimates supply APY (~4% range depending on util)
- Employee balance streams from contract
- Withdraw uses **full unlocked amount** (smoke 0.0001 cap removed)
- Session token issued for allowlisted employee (not open anonymous withdraw forever)

## What YOU need to do manually

### 1) Fund testnet USDC (important)
Deployer balance is low after smoke tests. For bigger demos:

1. Open Circle testnet faucet: https://faucet.circle.com
2. Send **testnet USDC** to:
   - `GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM` (deployer/employer signer)
3. Optional: also keep employee funded for receiving withdrawals:
   - `GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4`

Also keep testnet XLM for fees on the deployer identity (`stellar keys` → `yieldflow-deployer`).

### 2) Set Vercel env (frontend project)
Production URL expected: `https://yieldflow-frontend.vercel.app`

Set these on **Production + Preview**:

```
YIELDFLOW_ALLOWED_ORIGIN=https://yieldflow-frontend.vercel.app
YIELDFLOW_RPC_URL=https://soroban-testnet.stellar.org
YIELDFLOW_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
YIELDFLOW_PUBLIC_KEY=GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM
YIELDFLOW_VAULT_CONTRACT_ID=CDVT3Y47BTCZ2GLV4JJQTPGGFPJEXXM4BRJLLQIEZRVKRCNPO3M7CBVX
YIELDFLOW_STREAMING_CONTRACT_ID=CCF4CYV2K7EVOP46UU7ZLS7Z3LEZKT5OIVCOQPGK6DKW7RWGUW6SESOS
YIELDFLOW_BLEND_POOL_ID=CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW
YIELDFLOW_TOKEN_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
YIELDFLOW_EMPLOYEE_ADDRESS=GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4
YIELDFLOW_SESSION_SECRET=<long-random-string>
YIELDFLOW_SIGNER_SECRET=<yieldflow-deployer secret S...>
```

Then redeploy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-full-mvp.ps1
```

Or from `frontend/`: `npx vercel deploy --prod --yes`

### 3) Local backend (optional)
```powershell
cd backend
$env:YIELDFLOW_SIGNER_SECRET = (stellar keys secret yieldflow-deployer)
$env:YIELDFLOW_VAULT_CONTRACT_ID = "CDVT3Y47BTCZ2GLV4JJQTPGGFPJEXXM4BRJLLQIEZRVKRCNPO3M7CBVX"
$env:YIELDFLOW_STREAMING_CONTRACT_ID = "CCF4CYV2K7EVOP46UU7ZLS7Z3LEZKT5OIVCOQPGK6DKW7RWGUW6SESOS"
$env:YIELDFLOW_BLEND_POOL_ID = "CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW"
npm start
```

### 4) Do NOT use mainnet 50 XLM yet
Your Freighter mainnet XLM is reserved for later. This work is **testnet only**. No mainnet deploy was performed.

## Security status (honest)

Improved vs old demo:
- Employee allowlist
- HMAC session token for withdraw path
- Full unlock withdraw (no fake micro cap)
- Real Blend routing
- Real stats/APY path

Still **not bank-grade / not mainnet-ready**:
- Server hot signer still moves funds (testnet operator model)
- Auth is allowlist session, **not full Passkey Kit / WebAuthn yet**
- Activity feed is process-memory (resets on cold start)
- No formal audit
- Chart decorative points still partly cosmetic (headline APY is live estimate)

## DeFindex note
Architecture target remains **DeFindex → Blend**. This ship is **direct Blend supply from vault** (Path A working on-chain) with contract interface ready for strategy expansion. DeFindex router can wrap this later without changing the UI story much.

## Quick verify commands
```text
GET /api/health
GET /api/stats          # expect blendEnabled true, projectedApy != 0.0 when pool live
GET /api/employee/balance?employeeId=GBPDU4...
POST /api/employee/login
```
