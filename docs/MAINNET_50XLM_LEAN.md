# 50 XLM lean mainnet path

## Reality
- **50 XLM can work** for YieldFlow if deploy succeeds first try.
- Optimized wasms are small (~6.6 KB streaming, ~8.7 KB vault).
- Failed retries waste XLM — script is fixed to use correct `init` entrypoints.

## Cost rules
1. Use optimized wasm only
2. One clean deploy run
3. Correct args (old script used `initialize` — that would fail and burn fees)
4. No extra streams/deposits until smoke
5. Optional: build first, then `-SkipBuild` to isolate steps

## Defaults
| Item | ID |
|------|-----|
| USDC SAC | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Blend FixedV2 | `CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD` |

## Sequence
```powershell
# identity
powershell -ExecutionPolicy Bypass -File .\scripts\setup-mainnet-identity.ps1

# fund that address with your 50 XLM from Freighter

# readiness
powershell -ExecutionPolicy Bypass -File .\scripts\check-mainnet-ready.ps1

# ONLY after you say "go mainnet deploy":
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-mainnet.ps1 -MinXlm 35
```

## If mid-deploy balance dies
- Do **not** re-run full script blindly
- Check which step finished
- Top up 10–20 XLM if needed, resume remaining invokes only

## After deploy
1. Tiny USDC smoke (1–5 USDC)
2. Create small stream
3. Passkey withdraw once
4. Then switch Vercel env to mainnet IDs
