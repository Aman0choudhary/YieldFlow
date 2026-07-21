# YieldFlow — Best Current Plan

> **Scope authority:** `PRD.md` (YieldFlow v2.1 execution-ready PRD) defines product scope, cut list, and phase goals.  
> This file remains the tactical engineering sequence and status companion. If they conflict, `PRD.md` wins on scope.

---

**File:** `update.md`  
**Status:** Active recommendation  
**Date:** 2026-07-21  
**Based on:** `YIELD_FLOW_IMPROVEMENT_PLAN.md` (v2, approved) + current repo state  
**Branch focus:** `frontend-aditya`

---

## 1. Bottom line

**Best plan right now:** execute the approved improvement plan strictly.

```text
Phase 0a  extract pages/hooks
    →
Phase 0   one job per tab (IA cleanup)
    →
Phase 1   Flows depth (ops + money hops)
    →
Phase 2   Activity depth (audit ledger)
    →
Phase 3   real Stellar behind the same SDK
```

Do **not** start a visual redesign, sidebar rebuild, or separate employer/employee apps yet.  
The product feels basic because **tabs do not own different jobs**, not because the palette is wrong.

Keep:
- cinematic warm fintech UI (colors, type, glass)
- SDK boundary (UI never talks to Stellar directly)
- mock-first demo path until narrative is solid

---

## 2. Why this plan (not redesign)

| Problem today | What fixes it |
|---|---|
| Dashboard / Flows / Activity feel like the same page | Exclusive tab ownership |
| Demo story is hard to narrate | Health → hop → ledger path |
| Activity is a feed, not an audit trail | Ledger table + detail + export |
| Flows is not a full ops console | Fund wizard + hop timeline + stream physics |
| `App.tsx` still owns most UI | Finish Phase 0a extraction |
| Money actions feel demo-y | Confirm + receipt + status timeline |

Professional payroll feel comes from **structure, language, trust, and auditability** — not a new theme.

---

## 3. Current status (as of 2026-07-21 — post closeout)

| Phase | Goal | Status |
|---|---|---|
| **0a** | Extract pages/hooks; shell-only `App.tsx` | **Done** — App is shell + hooks + page switch; pages own UI |
| **0** | Mutual exclusive tab content | **Done** — Dashboard health / Flows ops / Activity audit |
| **1** | Flows depth | **Done** — fund wizard, hops, stream physics, scenario, confirm + receipt |
| **2** | Activity audit depth | **Done** — ledger, filters, search, drawer, queue board, CSV, single activity writer |
| **3** | Real Stellar / contracts | **Ready path** — env swap + stellar-sdk surface + scaffolds/scripts; live RPC needs CLI + contract IDs |
| **4** | Extra polish | **Done** — health strip, demo reset settings, escape/a11y polish |

### What already works

- Vite + React + TypeScript frontend
- Mock SDK: deposits, withdrawals, passkey login, balances, tx lifecycle, runtime activity log
- Exclusive tab ownership + hash routes
- Confirm dialog + settlement receipt for money actions
- Activity integrity: SDK writes history; UI reloads / patches status only
- Warm design system + motion polish

### What is still weak / next

- Real Stellar RPC + contracts not wired (Phase 3)
- Optional polish: dashboard health strip, in-app demo reset, denser receipts
- `App.tsx` still holds shared handlers (acceptable shell; not monolith UI)

---

## 4. Core principle: one job per tab

| Tab | One-sentence job | User question |
|---|---|---|
| **Dashboard** | Command center | “Am I healthy right now?” |
| **Flows** | Capital pipeline | “How does money move, and can I operate it?” |
| **Activity** | Settlement ledger | “What happened, and can I prove it?” |

**Hard rule:** no major panel should appear on more than one tab (tiny status chips are OK).

### Content ownership

| Capability | Owner tab | Others get |
|---|---|---|
| Fund payroll (input + submit) | **Flows** | Dashboard: “Open Flows to fund →” |
| Withdraw (full management) | **Flows** | Dashboard: quick-withdraw only (unlocked, read-only amount) |
| Full activity ledger | **Activity** | Dashboard: last 3 events + “View all →” |
| Live stream ticker / controls | **Flows** | Dashboard: read-only summary |
| Allocation editor | **Flows** | nowhere |
| Tx queue board | **Activity** | Flows: current-operation hop status only |
| Passkey login | **Dashboard** | Flows: “Sign in on Dashboard →” |
| Pipeline canvas | **Flows** | Dashboard: simplified 3-node mini-map (read-only) |
| Search + filters + CSV | **Activity** | nowhere |

**PR enforcement:** do not merge if a major panel title appears on more than one page.

---

## 5. Target architecture per tab

```text
Dashboard                 Flows                         Activity
─────────────────────     ──────────────────────────    ──────────────────────────
Health KPIs               Pipeline canvas               Full ledger table
Live balance (summary)    Allocation policy             Filters + search
Session / passkey         Fund payroll wizard           Tx detail drawer
Last 3 events             Stream engine controls        Pending / failed queues
Deep links → Flows/Act.   Withdraw / exit path          Export + explorer links
                          Live hop status (current tx)  Replay link → Flows
```

### Dashboard — keep / remove

**Keep**
- 4 metric cards: total pool, yield earned, buffer reserve, active employees
- Live stream balance (read-only summary)
- Session / passkey status
- CTA strip: Sign in / Open Flows / Open Activity
- Last 3 events + “View all activity →”
- Optional quick-withdraw (unlocked only)

**Remove / move**
- Full activity feed → Activity
- Full allocation editor → Flows
- Full settlement path → Flows
- Duplicate fund + full withdraw surfaces → Flows

**Success:** scannable in ~5 seconds.

### Flows — unique modules

| Module | Purpose |
|---|---|
| Pipeline canvas | Employer → Vault → Buffer/Yield → Stream → Employee wallet |
| Allocation control | Buffer % vs yield %; capacity vs yield tradeoff |
| Fund payroll wizard | Amount → split preview → submit → hop status |
| Stream engine | Rate/sec, cap, next payday, unlocked % |
| Exit / withdraw | Unlocked vs locked; reverse settle path |
| Scenario mode | “If I deposit $X, what happens?” (mock calc) |

**Success:** demo can narrate money hops without leaving Flows.

### Activity — unique modules

| Module | Purpose |
|---|---|
| Ledger table | Time, kind, amount, status, tx hash, counterparty |
| Smart filters | Kind + status + date range |
| Search | Hash / amount / label |
| Detail drawer | Timeline, amounts, related stream, mock explorer link |
| Export | CSV of current filter |
| Integrity strip | Pending / failed / last confirmed counts |

**Success:** feels like a bank/audit statement, not a second dashboard.

---

## 6. Phased delivery

### Phase 0a — File extraction (prerequisite)

**Goal:** no behavior change; make later IA work possible.

- Wire existing `pages/Dashboard.tsx`, `pages/Flows.tsx`, `pages/Activity.tsx` as the only page render path
- Keep shared state/handlers in App or hooks; pages receive props / context
- Finish hook ownership: session, stats, stream balance, transactions, activity, notifications
- Extract shared UI pieces as needed: MetricCard, FlowMap, FilterChips, etc.
- `App.tsx` becomes: shell + nav + providers + page switch only
- Sync `docs/sdk-contract.md` with actual SDK surface (`getActivity`, etc.)
- Fix `project.md` to link `context.md` instead of embedding it

**Exit criteria**
- [ ] Zero intentional visual change
- [ ] `npm --prefix frontend run build` passes
- [ ] `App.tsx` is under ~150 lines
- [ ] Pages own their UI

**Est.:** 2–3 hours

---

### Phase 0 — IA cleanup (frontend only)

**Goal:** three modes of one product, not three skins.

- Enforce exclusive content ownership (§4)
- Dashboard: strip fund/full-withdraw/full activity; add deep links
- Keep Dashboard quick-withdraw (unlocked only)
- Flows: pipeline + fund + allocation + stream/withdraw only
- Activity: ledger-first; remove health/fund primary surfaces
- Empty states per page (not-connected, no-data)
- Hash routes: `#/dashboard`, `#/flows`, `#/activity`
- A11y: `aria-expanded` on expandable rows; `role="tab"` + `aria-selected` on filters; skip link; focus on tab switch
- Fix async polling race (`forEach(async ...)` → sequential queue or `Promise.allSettled` + guard)
- Preserve visual language; no chain work

**Exit criteria**
- [ ] Switching tabs feels like three distinct jobs
- [ ] No major panel title appears on more than one page
- [ ] Meaningful empty states on fresh launch
- [ ] Hash routes work
- [ ] Build passes

**Est.:** 4–6 hours

---

### Phase 1 — Flows depth (mock)

**Goal:** money-hop narrative is demo-ready.

- Deposit amount + buffer/yield split preview
- Hop timeline for active transaction
- Stream physics panel (rate, cap, unlocked, next payday)
- Scenario mode: “what if I fund X?”
- Upgrade mock `getActivity` to accumulate runtime actions
- Ensure `ActivityItem` has `status` + `txHash` (and use them)
- Optional mock helpers: `previewDeposit`, richer stream physics

**Exit criteria**
- [ ] Can fund → watch hops → stream → withdraw on Flows
- [ ] Runtime actions show up in activity data
- [ ] Build passes

**Est.:** 5–8 hours

---

### Phase 2 — Activity depth (mock)

**Goal:** audit credibility.

- Ledger table columns: time, type, amount, status, hash
- Status filters + search
- Detail drawer with step timeline
- Pending / confirmed / failed board
- Copy hash + mock explorer URL
- CSV export (last item; high demo value)

**Exit criteria**
- [ ] Deposit + withdraw rows appear with status lifecycle
- [ ] Detail drawer proves the event
- [ ] Export works on current filter
- [ ] Build passes

**Est.:** 4–6 hours

---

### Phase 3 — Real Stellar behind the same SDK

**Only after mock narrative is solid.**

Planned contracts:
- `streaming` — salary accrual
- `vault` — employer deposits, buffer, withdrawal accounting
- `defindex_router` — yield routing adapter

Also:
- real `getTransactionStatus` behind SDK
- passkey/smart account inside SDK (optional mock fallback)
- scripts: `demo:reset`, seed, deploy testnet

**Rules still hold**
- amounts as strings
- UI imports SDK only
- lifecycle states stay identical

---

### Phase 4 — Product polish

- Advanced a11y audit
- keyboard nav / reduced-motion continuity
- optional light settings
- payroll copy pass and trust UI (confirmations, receipts) if not already included in 0–2

---

## 7. Professional payroll feel (inside this plan, not a new plan)

Do these as polish during Phases 0–2. Do **not** fork a redesign track.

| Upgrade | When |
|---|---|
| Payroll language (“Fund pay run”, “Audit trail”, “Settlement status”) | Phase 0 |
| Page header with context chips (pay period, USDC, network, last synced) | Phase 0 |
| Confirm dialog + receipt for deposit/withdraw | Phase 1 |
| Activity as table + status badges, not social feed | Phase 2 |
| Semantic status colors (pending / confirmed / failed) | Phase 2 |
| Dense scannable rows for ledger | Phase 2 |

### Explicitly out of scope for now

- Full sidebar redesign
- Separate employer app vs employee app
- New top-level tabs (Employees, Settings, Approvals)
- Palette / typography overhaul
- Direct Stellar calls from React components
- Multi-employer admin suite

Resolved decision (from approved plan): **tab split is correct** for the demo. Employer/employee separation is post-hackathon.

---

## 8. Shared state architecture

One source of truth across tabs.

| Layer | Responsibility |
|---|---|
| App state / hooks | stats, balance, session, tx queue, activity |
| Dashboard | read models + deep links |
| Flows | mutations (deposit/withdraw) that push activity + update stats |
| Activity | read, filter, expand, export history |

**Hooks**
- `useSession` — auth / login
- `useStats` — global read-only stats
- `useStreamBalance` — live ticker
- `useTransactions` — pending → confirmed polling
- `useActivity` — ledger read/write
- `useNotifications` — toasts

**Invariant:** any deposit / withdraw / login writes **one** activity item and updates **one** stats model. Tabs only choose presentation.

### Target frontend structure

```text
frontend/src/
  App.tsx                      # shell, nav, providers, page switch only
  pages/
    Dashboard.tsx
    Flows.tsx
    Activity.tsx
  components/
    metrics/
    activity/
    flows/
    layout/                    # optional PageHeader, AppShell pieces
  hooks/
    useSession.ts
    useStats.ts
    useStreamBalance.ts
    useTransactions.ts
    useActivity.ts
    useNotifications.ts
  sdk/
    yieldflow-sdk.ts
  animation-utils.ts
  styles.css
```

---

## 9. Demo narrative (acceptance story)

Reviewer path in **2–3 minutes**:

1. **Dashboard** — pool live, employees streaming, session healthy  
2. **Flows** — deposit $50k → buffer/yield split → stream ticks → withdraw hop  
3. **Activity** — every hop is an auditable row with pending → confirmed  

### Click-by-click script

| Step | Tab | Action | Expected |
|---|---|---|---|
| 1 | Dashboard | Fresh load | 4 KPIs, session offline, last 3 events, CTAs |
| 2 | Dashboard | Sign in with Passkey | Session active, balance ticks |
| 3 | Dashboard | Observe stream summary | “Open Flows to fund” visible |
| 4 | Flows | Open Flows | Pipeline + allocation + fund wizard |
| 5 | Flows | Fund $50,000 | Split preview + hop timeline |
| 6 | Flows | Watch status | Building → Submitted → Pending → Confirmed |
| 7 | Flows | Request payout | Withdraw submitted; can jump to Activity |
| 8 | Activity | Observe ledger | Deposit + withdraw rows, filters work |
| 9 | Activity | Open row detail | Timeline, hash, related stream |
| 10 | Activity | Optional CSV export | Download proves audit capability |

**Demo reset:** clear storage + refresh; full `demo:reset` script in Phase 3.

---

## 10. Priority matrix

| Priority | Item | Impact | Effort | Est. |
|---|---|---|---|---|
| **P0** | Finish Phase 0a extraction | High (unblocks all) | Low–Med | 2–3h |
| **P0** | Mutual exclusive tab content | High | Low–Med | 3–4h |
| **P0** | Hash routes + empty states + a11y | Med–High | Low | 1–2h |
| **P0** | Fix async polling bug | Med | Low | 30m |
| **P1** | Flows wizard + hops + scenario | High | Med | 4–6h |
| **P1** | Runtime `getActivity` + status/hash fields | Med | Low | 1–2h |
| **P1** | Activity drawer + status filters | High | Med | 4–6h |
| **P2** | `previewDeposit` / detail helpers | Medium | Low–Med | 2–3h |
| **P2** | CSV export | Med | Low | 30m |
| **P3** | Contracts + testnet scripts | High long-term | High | Days |

### Timeline to demo-ready

| Phase | Est. |
|---|---|
| 0a | 2–3 hours |
| 0 | 4–6 hours |
| 1 | 5–8 hours |
| 2 | 4–6 hours |
| **Total** | **~15–23 hours** |

---

## 11. Definition of done

### Tabs are good when

- [ ] Dashboard answers health in one screen
- [ ] Flows is the only place to operate the pipeline
- [ ] Activity is the only full history / audit surface
- [ ] Deposit / withdraw / login still create shared activity + update shared stats
- [ ] A new reviewer can explain each tab in one sentence
- [ ] Visual design still matches the current warm system
- [ ] `npm --prefix frontend run build` passes
- [ ] UI still imports only the SDK

### Demo-ready when

- [ ] Phases 0a + 0 + 1 + 2 complete
- [ ] Full narrative (health → hop → ledger) works end-to-end on mock
- [ ] Failures (cancelled passkey, failed tx) are visible and recoverable

### Testnet-ready when

- [ ] Phase 3 contracts + scripts deployed
- [ ] Mock → real SDK swap path documented
- [ ] Real tx hashes open in explorer

---

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tabs still feel duplicated | Enforce ownership table in PR review |
| Scope creep into redesign | Explicit non-goal; reuse CSS tokens |
| SDK surface churn | Treat SDK as contract; sync `docs/sdk-contract.md` first |
| Mock ≠ chain behavior | Keep string amounts; identical lifecycle states |
| Monolith blocks progress | Finish Phase 0a before content re-slice |
| Static mock data blocks Activity | Runtime activity accumulation in Phase 1 |
| Fresh demo looks empty/broken | Empty states in Phase 0 |

---

## 13. Immediate next step

**Phases 0a–4 product path complete for mock demos.** For live testnet:

1. Install Rust toolchain + `stellar` CLI; fund deployer identity
2. `npm run deploy:testnet` → write IDs to `deployments/testnet.json`, `config/testnet-usdc.json`, `sdk/config.ts`
3. Fill RPC invoke bodies in `sdk/stellar-sdk.ts` (surface already matches mock)
4. `VITE_YIELDFLOW_SDK=stellar npm --prefix frontend run dev`
5. Keep mock fallback for demos without funded keys

---

## 14. Related files

| Path | Role |
|---|---|
| `YIELD_FLOW_IMPROVEMENT_PLAN.md` | Full approved v2 plan (source of truth detail) |
| `update.md` | This file — best current execution plan |
| `frontend/src/App.tsx` | Still too large; primary 0a target |
| `frontend/src/pages/*` | Page components (partially extracted) |
| `frontend/src/hooks/*` | Shared state hooks (exist; must own more logic) |
| `frontend/src/styles.css` | Design system — keep centralized |
| `sdk/mock-sdk.ts` | Mock integration; activity accumulation needed |
| `sdk/types.ts` | Shared types; status/hash on activity |
| `docs/sdk-contract.md` | UI ↔ chain boundary docs |
| `context.md` | Implementation changelog |
| `project.md` | Project overview |

---

## 15. Changelog

| Date | Note |
|---|---|
| 2026-07-21 | Created `update.md` as the best current plan: stay on approved Phase 0a → 0 → 1 → 2 → 3 path; record partial extraction status; fold professional-payroll upgrades into 0–2 without redesign fork |
| 2026-07-21 | Status refresh: Phases 0a–2 marked done; activity single-writer + receipt closeout; next is Phase 3 Stellar |

---

**Decision:** Phases 0a–4 complete for mock-first product. Live chain = finish Phase 3 RPC after CLI deploy. No redesign track.



| 2026-07-21 | Phases 3 readiness + 4 polish: SDK mode swap, stellar surface, health strip, demo reset |

