# Phase 3 — DeFindex strategy layer (testnet)

## What shipped
- Live reads from public DeFindex testnet USDC vault:
  - Vault: `CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN`
  - Strategy: `CALLOM5I7XLQPPOPQMYAHUWW4N7O3JKT42KQ4ASEEVBXDJQNJOALFSUY` (USDC Blend Strategy)
  - Factory: `CDSCWE4GLNBYYTES2OCYDFQA2LLY4RBIAX6ZI32VSUXD7GO6HRPO4A32`
- `/api/stats` now includes `defindex` + `yieldStack`
- `/api/defindex` dedicated overview endpoint
- Employer dashboard section **DEFINDEX STRATEGY LAYER** (TVL, strategy, stack)

## Important asset note
| System | USDC |
|--------|------|
| YieldFlow payroll vault (live yield) | Circle testnet USDC `CBIELT...` → Blend pool `CAPBMX...` |
| Public DeFindex USDC vault | Blend USDC `CAQCFV...` → Blend strategy |

So payroll **earns on Blend directly** with Circle USDC. DeFindex is integrated as the **strategy router / market layer** (live TVL + Blend strategy metadata). Full on-chain deposit into DeFindex requires matching USDC (mainnet Circle USDC path or a testnet swap/bridge into Blend USDC).

## Env (optional overrides)
```
YIELDFLOW_DEFINDEX_VAULT_ID=CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN
YIELDFLOW_DEFINDEX_STRATEGY_ID=CALLOM5I7XLQPPOPQMYAHUWW4N7O3JKT42KQ4ASEEVBXDJQNJOALFSUY
YIELDFLOW_DEFINDEX_FACTORY_ID=CDSCWE4GLNBYYTES2OCYDFQA2LLY4RBIAX6ZI32VSUXD7GO6HRPO4A32
```

## Next for full DeFindex money path
1. Align token to DeFindex vault asset (or add swap)
2. Vault `deposit` yield leg → DeFindex `deposit(amounts, mins, from, invest=true)`
3. Withdraw path: DeFindex shares → USDC → buffer
