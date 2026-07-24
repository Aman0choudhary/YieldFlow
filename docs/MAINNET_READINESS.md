# Mainnet Readiness — YieldFlow
**Status: PREP ONLY. No mainnet contracts deployed. No mainnet env applied.**

Your ~50 XLM in Freighter is reserved until you explicitly say **go mainnet deploy**.

---

## 1) Why mainnet is easier on assets than testnet

On **mainnet**, Circle USDC SAC and Blend USDC id align:

| Item | Mainnet ID |
|------|------------|
| USDC issuer | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| USDC SAC | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| DeFindex factory | `CDKFHFJIET3A73A2YN4KV7NSV32S6YGQMUFH3DNJXLBWL4SKEGVRNFKI` |
| DeFindex USDC Blend strategy | `CDB2WMKQQNVZMEBY7Q7GZ5C7E7IAFSNMZ7GGVD6WKTCEWK7XOIAVZSAP` |
| Soroswap Earn USDC vault (DeFindex) | `CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK` |

So **DeFindex → Blend** money path is viable on mainnet after YieldFlow vault/streaming deploy.

Config source of truth: `config/mainnet-usdc.json`  
Deployment template: `deployments/mainnet.template.json`  
Env template: `backend/.env.mainnet.example`

---

## 2) Go / no-go checklist (must be green)

### Product / chain
- [x] Testnet vault + stream + Blend direct yield working
- [x] Passkey WebAuthn login working on production domain
- [x] DeFindex live stats integrated (testnet reference; mainnet addresses catalogued)
- [ ] Confirm **mainnet Blend pool** that holds USDC SAC `CCW67…` (query reward zone / reserves)
- [ ] Decide yield route at launch:
  - **A)** Direct Blend pool (simpler, proven pattern), or
  - **B)** DeFindex vault deposit + Blend strategy (matches pitch; more moving parts)
- [ ] Deploy **new** streaming + vault on mainnet (do not reuse testnet IDs)
- [ ] Init vault with mainnet USDC SAC + set blend pool and/or DeFindex vault
- [ ] Create first employee stream with real (small) USDC amounts
- [ ] Smoke: deposit → stats → employee unlock → withdraw

### Security (blockers for real money)
- [ ] **Do not** reuse testnet deployer key as long-term mainnet treasury
- [ ] Prefer Freighter/hardware for employer deposits; limit hot `YIELDFLOW_SIGNER_SECRET`
- [ ] If hot signer used at all: **minimal XLM + minimal USDC**, monitor, plan rotation
- [ ] CORS locked to `https://yieldflow-frontend.vercel.app` (not `*`)
- [ ] Strong unique `YIELDFLOW_SESSION_SECRET`
- [ ] Employee allowlist only known addresses
- [ ] Passkey RP_ID/ORIGIN = production domain only
- [ ] No secrets in git / frontend bundle
- [ ] Rate-limit or monitoring on `/api/deposit` and `/api/withdraw`
- [ ] Incident plan: pause deposits, rotate keys, freeze allowlist

### Ops / funding
- [ ] Mainnet identity created (`yieldflow-mainnet` or Freighter account)
- [ ] Fund **~50 XLM** for deploy + fees (your reserved balance)
- [ ] Fund **small USDC** for smoke (e.g. $5–$20), not full payroll
- [ ] Trustline / SAC usage for USDC on employer + employee
- [ ] Separate testnet and mainnet Vercel envs (or careful switch with rollback plan)

### Legal / product honesty
- [ ] UI labels say mainnet only after switch
- [ ] No “gasless relayer” claim unless relayer is real
- [ ] No “audited” claim without audit
- [ ] Disclose smart-contract + DeFi risk

---

## 3) Recommended launch sequence (when you say go)

1. **Confirm Blend USDC pool id** on mainnet (do not guess).
2. Create/import mainnet deployer key; fund XLM from Freighter.
3. `.\scripts\deploy-mainnet.ps1 -SourceAccount <id> -TokenContractId CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75`
4. `set_blend_pool` to confirmed pool (and/or wire DeFindex vault if choosing route B).
5. Write `deployments/mainnet.json` from template.
6. Apply `backend/.env.mainnet.example` values to Vercel **after** double-check.
7. Deploy frontend production.
8. Smoke with **tiny** USDC only.
9. Only then scale amounts.

---

## 4) Explicit non-actions (this prep commit)

- ❌ No mainnet contract deploy
- ❌ No mainnet Vercel env applied
- ❌ No spending of your 50 XLM
- ❌ No production cutover from testnet

---

## 5) Residual risks even after checklist

| Risk | Mitigation |
|------|------------|
| Hot server signer | Minimize balance; migrate to wallet-signed deposits ASAP |
| Smart contract bugs | Start with small TVL; consider audit before scale |
| Blend/DeFindex market risk | Buffer %, rebalance, monitoring |
| Passkey device loss | Reset passkey UX; multi-device later |
| Ops key loss | Backup policy for deployer keys (offline) |

---

## 6) Command you will give later

When ready for real deploy (not now):

> **go mainnet deploy**

Until then, production stays on **testnet**: https://yieldflow-frontend.vercel.app/

---

## Pre-deploy fixes completed (before chain deploy)

- [x] Confirmed mainnet USDC SAC = Circle/Blend shared id
- [x] Confirmed mainnet Blend FixedV2 pool includes USDC
- [x] Rotated strong admin + session secrets on Vercel (see local gitignored secrets file)
- [x] CSP + security headers in `frontend/vercel.json`
- [x] Mainnet mode requires admin key for deposit/stream/rebalance
- [x] `scripts/check-mainnet-ready.ps1` readiness checker
- [x] `scripts/setup-mainnet-identity.ps1` identity helper (no deploy)
- [ ] Create/fund mainnet deployer identity with XLM
- [ ] Rotate Groq key in Groq console (was pasted in chat)
- [ ] Explicit user command: **go mainnet deploy**

