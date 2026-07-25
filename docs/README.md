# Docs index

## Public / judging
- **JUDGE_TECH_QA.md** — full technical Q&A for judges (start here)

## Internal ops (not the product pitch)
These are operator notes. Safe to ignore during demo judging unless asked about deployment.

| File | Purpose |
|------|---------|
| MAINNET_READINESS.md | Launch checklist |
| MAINNET_50XLM_LEAN.md | Lean deploy budget notes |
| SECURITY_HARDENING.md | Hardening changelog |
| ADMIN_ACCESS.md | How operators open admin console |
| AI_GUIDE.md | In-app AI guide notes |
| DEFINDEX_PHASE.md | DeFindex integration phase notes |
| TESTNET_MVP_STATUS.md | Historical testnet status |
| deployment.md / vercel-combined-deploy.md / sdk-contract.md | Deploy & SDK wiring |

**Do not commit secrets** (admin keys, signer seeds, AI keys). Those live only in Vercel env / local gitignored files.
