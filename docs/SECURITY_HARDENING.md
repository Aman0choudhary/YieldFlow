# Security hardening (high fixes)

Applied on production testnet:

1. **Withdraw** always requires passkey-issued employee session (no allowlist-only bypass).
2. **Deposit / stream / rebalance** require same-site CSRF cookie **or** `X-YieldFlow-Admin-Key`.
3. **CORS fail-closed** — `YIELDFLOW_ALLOWED_ORIGIN` must be exact app origin (not `*`).
4. **Dedicated `YIELDFLOW_SESSION_SECRET`** required (min 24 chars, != signer secret).
5. **Rate limits** on auth + money routes.
6. **WebAuthn userVerification: required**.

## Ops notes
- Browser app uses `credentials: "include"` so CSRF cookie is sent.
- Optional admin key for CLI/scripts:
  ```
  YIELDFLOW_ADMIN_API_KEY=...
  curl -H "X-YieldFlow-Admin-Key: $KEY" ...
  ```
- Frontend Fund Vault works after any GET (health/stats/employer) sets CSRF cookie.

## Still not mainnet-grade
- Hot signer still exists on server
- No formal audit
- Passkey seal still in localStorage (XSS surface)
