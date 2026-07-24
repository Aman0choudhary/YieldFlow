# Admin access

## Admin key (set on Vercel)
`YIELDFLOW_ADMIN_API_KEY` — used for privileged API calls.

**Do not put this key in public posts or frontend env (`VITE_*`).**

## How to open the Admin panel (UI)
1. Open https://yieldflow-frontend.vercel.app/
2. Open the center **MENU**
3. Choose **06 ADMIN CONSOLE**
4. Paste the admin API key → **Unlock admin**
5. Deposit / create stream / health

Key is stored only in **sessionStorage** for that browser tab session.

## How to use admin key via API (CLI)
```bash
curl -X POST https://yieldflow-frontend.vercel.app/api/deposit \
  -H "content-type: application/json" \
  -H "X-YieldFlow-Admin-Key: YOUR_KEY" \
  -d "{\"amount\":\"10\"}"
```

## Note
- Normal **Employer Fund Vault** button does **not** need the admin key (uses CSRF same-site cookie).
- **Employee withdraw** needs **passkey session**, not admin key.
- Admin key cannot be used to withdraw as an employee.
