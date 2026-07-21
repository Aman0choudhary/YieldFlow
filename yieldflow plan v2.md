# YieldFlow Plan v2 — Live Execution Status

**Source:** PRD v2.1 (`PRD.md` is scope authority)  
**Companion:** `update.md`, `docs/PHASE3_STELLAR_SWAP.md`  
**Branch:** `frontend-aditya`  
**Updated:** 2026-07-21  

> This file is the **plan + status tracker**. Full product requirements live in `PRD.md`.  
> If scope conflicts, **PRD.md wins**.

---

## 1. Product loop (do not break)

```text
Employer deposit
  → treasury allocation (buffer + yield)
  → continuous employee stream
  → withdrawal
  → audit proof
```

Guiding line: **Money never stops working.**

---

## 2. Tab ownership (non-negotiable)

| Tab | Job | Question |
|-----|-----|----------|
| **Dashboard** | Command center | Am I healthy right now? |
| **Flows** | Capital pipeline ops | How does money move, and can I operate it? |
| **Activity** | Settlement ledger | What happened, and can I prove it? |

**PR rule:** no major panel title on more than one page.

---

## 3. Phase status

### Phase 0 — Integration foundation — **DONE**

- [x] Wire `App.tsx` to `pages/*` + `hooks/*`
- [x] Remove live monolith page UI
- [x] Boot from SDK stats/activity/session
- [x] Hash routes `#/dashboard` `#/flows` `#/activity`
- [x] Shared deposit/withdraw/login handlers
- [x] Single activity truth path (`reloadActivity` / SDK writer)
- [x] Build passes

### Phase 1 — Product IA + living core — **DONE**

- [x] Enforce tab ownership
- [x] Page headers / empty states
- [x] Treasury breakdown (Available / Streaming / Locked / Yield)
- [x] Health strip
- [x] Confirm + receipt for money actions
- [x] Hop timeline from tx state (+ in-flight pulse)
- [x] Activity status badges + integrity strip
- [x] A11y basics (tabs, skip link, Escape, reduced-motion)
- [x] Polling robustness (`Promise.allSettled` + inflight guard)

### Phase 2 — Demo conversion layer — **DONE**

- [x] Employer savings / scenario calculator framing
- [x] Demo reset control (Settings gear → Reset demo)
- [x] Success / empty / error copy paths
- [x] CSV export
- [x] Keyboard demo aids (`1`/`2`/`3`, `?`, `Esc`)

### Phase 3 — Stellar readiness — **IN PROGRESS (scaffold)**

- [x] SDK mode switch `VITE_YIELDFLOW_SDK=mock|stellar`
- [x] `sdk/stellar-sdk.ts` same export surface as mock
- [x] Contract ID slots + Vite injection from `deployments/testnet.json`
- [x] Chain wrapper preserved as `sdk/yieldflow-sdk.chain.js`
- [x] Generated clients under `sdk/generated/*` (Aman path)
- [x] Runbook: `docs/PHASE3_STELLAR_SWAP.md`
- [ ] Deploy vault/streaming to testnet + write real contract IDs
- [ ] Wallet `signTransaction` for live writes
- [ ] Real explorer tx hashes from network
- [ ] Passkey Kit (optional mock fallback remains)

### Phase 4 — Deferred premium expansions — **NOT STARTED (by design)**

Only after Phase 3 live path is solid:

- [ ] Analytics charts with real history
- [ ] Earnings calendar / heatmap
- [ ] Command palette / global entity search
- [ ] Multi-employee management
- [ ] AI insights / multi-treasury RBAC

---

## 4. Journeys checklist

| Journey | Target | Mock status |
|---------|--------|-------------|
| A Demo narrative | 2–3 min health → fund → hop → withdraw → audit | Ready |
| B Employer value | Scenario split → fund/confirm | Ready |
| C Employee value | Passkey → stream → withdraw → receipt | Ready |
| D Failure recovery | Cancelled auth / failed tx → retry | Ready (mock random fail + clear errors) |

---

## 5. Technical invariants

1. UI imports **only** SDK (`frontend/src/sdk/yieldflow-sdk.ts`)
2. Amounts are **strings** on the TS boundary
3. SDK is source of truth for activity history
4. Tabs are presentation over shared hooks
5. Default demo mode is **mock** until Phase 3 IDs + signer exist
6. No full visual redesign

---

## 6. Immediate next actions (right now)

1. **Demo path:** `npm run dev` → complete Journey A on mock  
2. **Verify:** `npm run plan:verify`  
3. **Phase 3:** follow `docs/PHASE3_STELLAR_SWAP.md` when CLI + funded identity available  
4. Do **not** start Phase 4 domain sprawl  
5. Log outcomes in `context.md`

---

## 7. Definition of done (active v2)

YieldFlow Plan v2 active scope is done when:

1. [x] Live app is page architecture (not monolith)  
2. [x] Dashboard / Flows / Activity each have one clear job  
3. [x] Live streaming + treasury health are obvious  
4. [x] Fund/withdraw confirmable, trackable, receipted  
5. [x] Activity is audit ledger with detail + export  
6. [x] 2–3 minute mock demo narrative is reliable  
7. [x] Design system intact  
8. [ ] Path to real Stellar settlement is **live** (IDs + signer + explorer hashes)

Item 8 is the only open active-scope gate (Phase 3 live).

---

## 8. Cut list (still cut)

Do not build now: particle-primary UX, fake analytics, AI advisor, multi-org RBAC, separate employer/employee apps, native gesture OS.

---

## 9. Commands

```bash
npm run dev                 # mock UI
npm run plan:verify         # structural verify + frontend build
npm run deploy:testnet      # when stellar CLI ready
npm run demo:reset          # script helper; in-app Settings preferred
```

**Status:** Phases 0–2 complete · Phase 3 scaffolded · Phase 4 deferred · Execute Phase 3 only with chain toolchain.
