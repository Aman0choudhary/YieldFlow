# YieldFlow - Product Improvement Plan

**Status:** Approved with improvements (v2)  
**Date:** 2026-07-20  
**Repo:** https://github.com/Aman0choudhary/YieldFlow  
**Branch focus:** `frontend-aditya`  
**Audience:** product / frontend / Stellar integration review

---

## 1. Summary

YieldFlow is a Stellar-oriented payroll + yield demo:

- Employers deposit payroll into a yield-bearing pool
- Employees receive continuous salary streams
- Unlocked balance can be withdrawn (passkey-style auth in the mock)

The frontend already has three top-nav tabs (**Dashboard**, **Flows**, **Activity**), animations, and a locked mock SDK. The main product gap is **information architecture**:

> Flows and Activity still feel like Dashboard content with a different title, not distinct jobs.

This plan proposes a clear tab ownership model, phased delivery, and a path from mock UI -> real Soroban integration - **without redesigning the visual system**.

---

## 2. Goals

1. Make each tab answer a different user question.
2. Reduce duplicated panels across Dashboard / Flows / Activity.
3. Keep the cinematic warm fintech UI (colors, type, glass) unchanged.
4. Keep the rule: **UI never talks to Stellar directly** - only via SDK.
5. Ship a stronger demo narrative for reviewers and hackathon judges.
6. Leave a clean path for real contracts later.

---

## 3. Non-goals (for now)

- Full visual redesign (palette, spacing system, typography overhaul)
- Real Stellar RPC / Passkey Kit / DeFindex calls inside React components
- Multi-employer / multi-employee admin suite
- Extra top-level tabs (Settings can wait)
- Custom token contracts (use Stellar Asset Contract for USDC later)

---

## 4. Current state

### What works

- Vite + React + TypeScript frontend
- Mock SDK with deposits, withdrawals, passkey login, balances, tx lifecycle
- Dashboard metrics, live stream balance animation, activity feed, toasts
- Nav switches between Dashboard / Flows / Activity pages
- Build passes; design language is consistent

### What’s weak

| Area | Problem |
|------|---------|
| **Tab ownership** | Flows & Activity reuse Dashboard mental model (metrics, feed, fund/withdraw) |
| **Demo story** | Hard to narrate “how money hops” vs “what is health” vs “what happened” |
| **Activity depth** | Feed exists, but not a true audit ledger (search, status board, tx detail) |
| **Flows depth** | Settlement path is present, but not a full pipeline ops console |
| **Monolith** | `App.tsx` is 1,193 lines / 42 KB — all state, handlers, and 3 pages in one file |
| **Contracts** | Planned (`streaming`, `vault`, `defindex_router`) but not implemented |
| **PLAN.md** | Referenced historically but missing as a living product plan |

### Known bugs to fix

| Bug | Location | Impact |
|-----|----------|--------|
| **Async polling race** | `App.tsx` L210–L251 — `forEach(async ...)` inside `setInterval` can overlap concurrent polls; no error handling on in-flight promises | Tx status may stall or miss transitions under slow SDK |
| **Activity filter a11y** | `App.tsx` L1062 — filter chips use `role="tablist"` but individual chips lack `role="tab"` and `aria-selected` | Broken screen reader semantics |
| **Activity row a11y** | `App.tsx` L468 — expandable `<button>` rows lack `aria-expanded` attribute | Accessibility violation |
| **Static `getActivity`** | `mock-sdk.ts` L103–L111 — returns 4 hardcoded items every call; ignores runtime deposits/withdrawals | Phase 2 filters/search will have nothing meaningful to filter |
| **SDK doc drift** | `docs/sdk-contract.md` L66–77 — does not list `getActivity` even though it's already implemented and imported | Doc ≠ code |
| **Doc duplication** | `project.md` L57–L103 embeds `context.md` verbatim instead of linking | Will diverge as work progresses |

---

## 5. Core principle: one job per tab

| Tab | One-sentence job | User question |
|-----|------------------|---------------|
| **Dashboard** | Command center | “Am I healthy right now?” |
| **Flows** | Capital pipeline | “How does money move, and can I operate it?” |
| **Activity** | Settlement ledger | “What happened, and can I prove it?” |

**Rule:** no major panel should appear on more than one tab (tiny status chips are OK).

### 5.1 Content ownership table (hard rule)

| Capability | Owner tab | Others get... |
|------------|-----------|---------------|
| Fund payroll (input + submit) | **Flows** | Dashboard: "Open Flows to fund →" link |
| Withdraw (full management) | **Flows** | Dashboard: quick-withdraw button (unlocked only, read-only amount) |
| Full activity ledger | **Activity** | Dashboard: last 3 events + "View all →" link |
| Live stream ticker | **Flows** | Dashboard: read-only summary (no controls) |
| Allocation editor | **Flows** | nowhere |
| Tx queue board | **Activity** | Flows: current-operation-only hop status |
| Passkey login | **Dashboard** | Flows: "Sign in on Dashboard →" prompt |
| Pipeline canvas | **Flows** | Dashboard: simplified 3-node mini-map (read-only) |
| Search + filters | **Activity** | nowhere |
| CSV export | **Activity** | nowhere |

**Enforcement:** no PR merges if a major panel title appears on more than one page.

---

## 6. Target information architecture

```text
Dashboard                 Flows                         Activity
─────────────────────     ──────────────────────────    ──────────────────────────
Health KPIs               Pipeline canvas               Full ledger table
Live balance (summary)    Allocation policy             Filters + search
Session / passkey status  Fund payroll wizard           Tx detail drawer
Last 3 events             Stream engine controls        Pending / failed queues
Deep links -> Flows/Act.   Withdraw / exit path          Export + explorer links
                          Live hop status (current tx)  Replay link -> Flows
```

### 6.1 Dashboard - keep / remove

**Keep**

- 4 metric cards: total pool, yield earned, buffer reserve, active employees
- Live stream balance (read-only summary)
- Session / passkey status
- Primary CTA strip:
  - Sign in (if offline)
  - “Open Flows to fund”
  - “Open Activity to audit”
- Compact **last 3 events** with “View all activity ->”

**Remove / move**

- Full activity feed -> Activity
- Full treasury allocation editor -> Flows
- Full settlement path diagram -> Flows
- Duplicate fund + withdraw tool surfaces -> Flows (optional single quick-withdraw only if needed)

**Success:** scannable in ~5 seconds; no “second product” buried below the fold.

### 6.2 Flows - unique modules

| Module | Purpose |
|--------|---------|
| **Pipeline canvas** | Employer -> Vault -> Buffer / Yield route -> Stream -> Employee wallet |
| **Allocation control** | Buffer % vs yield %; preview instant capacity vs yield drag |
| **Fund payroll wizard** | Amount -> split preview -> submit -> hop-by-hop status |
| **Stream engine** | Rate/sec, cap, next payday, unlocked %, time-to-unlock |
| **Exit / withdraw** | Unlocked vs locked; reverse settle path |
| **Scenario mode** | “If I deposit $X, what happens to buffer & APY?” (mock calc) |

**Scenario mode mock math** (so it's not just another static panel):

```ts
bufferShare  = amount × (bufferPercent / 100)
yieldShare   = amount × (yieldRoutePercent / 100)
newPool      = currentPool + amount
projectedApy = currentApy × (1 - 0.002 × depositCount) // diminishing returns demo
```

**Activity on Flows:** only **in-flight steps** for the current operation  
(`Building -> Submitted -> Pending hop 2/4 -> Confirmed`) - not full history.

**Success:** a live demo can narrate money hops without leaving Flows.

### 6.3 Activity - unique modules

| Module | Purpose |
|--------|---------|
| **Ledger table** | Time, kind, amount, **status**, short **tx hash**, counterparty |
| **Smart filters** | Kind + status + date range |
| **Search** | Hash / amount / label |
| **Detail drawer** | Status timeline, amounts, related stream, mock explorer link |
| **Export** | CSV of current filter (demo-friendly) |
| **Integrity strip** | Pending count, failed count, last confirmed, auth events |

> **Note:** The ledger table requires `status` and `txHash` fields on `ActivityItem`. The current type (`sdk/types.ts`) lacks both — they must be added before Phase 2 work begins.

**Remove from Activity as main content**

- Metric cards, allocation bars, live stream hero, passkey panel  
  (optional tiny status chips only)

**Cross-links**

- Deposit row -> “Replay on Flows”
- Withdraw row -> stream snapshot in detail drawer

**Success:** feels like a bank/audit statement, not a second dashboard.

---

## 7. Shared state architecture

Tabs must share one source of truth so actions stay consistent.

| Layer | Responsibility |
|-------|----------------|
| **App state / hooks** | stats, balance, session, tx queue, activity list |
| **Dashboard** | read models + deep links |
| **Flows** | mutations (deposit/withdraw) that push activity + update stats |
| **Activity** | read, filter, expand history |

**Hook Decomposition Spec:**
- `useSession`: Auth state / login handler
- `useStats`: Global read-only stats
- `useStreamBalance`: Ticker logic (high frequency)
- `useTransactions`: Polling for `pending` -> `confirmed` transitions
- `useActivity`: Ledger read/write interface
- `useNotifications`: Transient toast state

**Invariant:** any deposit / withdraw / login writes **one** activity item and updates **one** stats model. Tabs only choose presentation.

### Required frontend structure (Phase 0a deliverable)

```text
frontend/src/
  App.tsx                      # shell, nav, providers, page switch only
  pages/
    Dashboard.tsx
    Flows.tsx
    Activity.tsx
  components/
    metrics/                   # MetricCard, SkeletonCard
    activity/                  # ActivityRow, ActivityList, FilterChips
    flows/                     # FlowMap, FlowNode, AllocationBar
  hooks/
    useSession.ts
    useStats.ts
    useStreamBalance.ts
    useTransactions.ts
    useActivity.ts
    useNotifications.ts
  sdk/
    yieldflow-sdk.ts           # re-export shared SDK
  animation-utils.ts
  styles.css
```

---

## 8. SDK boundary (keep locked)

Frontend must continue to import only SDK functions. No direct Stellar RPC/contract calls.

### Required mock fixes (before Phase 2)

1. **`getActivity`** must accumulate items from runtime actions instead of returning 4 hardcoded items.
2. **`ActivityItem` type** needs `status?: TxStatus` and `txHash?: string` fields.
3. **SDK Docs**: Sync `docs/sdk-contract.md` with actual SDK surface; it currently omits `getActivity`.

### Proposed mock extensions (for sharper tabs)

```ts
getFlowGraph(): Promise<FlowNode[]>

previewDeposit(amount: string): Promise<{
  bufferShare: string;
  yieldShare: string;
  projectedApy: string;
}>

getStreamPhysics(employeeId: string): Promise<{
  unlockedAmount: string;
  lockedAmount: string;
  ratePerSecond: string;
  secondsToPayday: number;
  bufferCoverageHours: number;
}>

getActivity(filter?: {
  kind?: string;
  status?: string;
  from?: string;
  to?: string;
})

getTransactionDetail(txHash: string): Promise<{
  status: TxStatus;
  steps: { label: string; at: string; status: TxStatus }[];
  amount: string;
  kind: string;
}>
```

---

## 9. Demo narrative (acceptance story)

A reviewer should be able to walk this path:

1. **Dashboard** - “Pool is live, employees are streaming, session is healthy.”
2. **Flows** - “I deposit $50k -> 15% buffer / 85% yield -> stream rate ticks -> withdraw hop.”
3. **Activity** - “Every hop is an auditable row with pending -> confirmed (or failed).”

### Demo script (click-by-click)

Target time: **2–3 minutes**.

| Step | Tab | Action | Expected result |
|------|-----|--------|-----------------|
| 1 | Dashboard | Land on page (fresh load) | 4 KPI cards, session offline, last 3 events, deep link CTAs |
| 2 | Dashboard | Click "Sign in with Passkey" | Passkey animation → session active, balance starts ticking |
| 3 | Dashboard | Observe live stream summary | Balance animates, "Open Flows to fund" CTA visible |
| 4 | Flows | Click "Open Flows" deep link | Pipeline canvas with 4 stages, allocation bars, fund wizard |
| 5 | Flows | Enter $50,000 → click "Fund payroll" | Split preview shows 15/85, hop timeline animates through stages |
| 6 | Flows | Watch hop status | `Building → Submitted → Pending → Confirmed` in ~3 seconds |
| 7 | Flows | Click "Request payout" in exit section | Withdraw submitted, auto-switches to Activity |
| 8 | Activity | Observe ledger | Both deposit and withdrawal rows visible, filters work |
| 9 | Activity | Click a row to expand detail | Step timeline, tx hash, related stream info |
| 10 | Activity | (Optional) Click "Export CSV" | Download triggers, proves audit capability |

**Demo reset:** clear `localStorage` and refresh. Add `demo:reset` script in Phase 3.

---

## 10. Phased delivery

### Phase 0a - File extraction (no behavior change) - **prerequisite**

> `App.tsx` is 1,193 lines / 42 KB. Re-slicing content inside this monolith will produce unreadable diffs. Extract first, then re-slice.

- Extract `pages/Dashboard.tsx`, `pages/Flows.tsx`, `pages/Activity.tsx`
- Extract hooks: `useSession`, `useStats`, `useStreamBalance`, `useTransactions`, `useActivity`, `useNotifications`
- Extract shared components: `ActivityRow`, `MetricCard`, `FlowMap`
- `App.tsx` becomes: shell + nav + providers + page switch only
- Sync `docs/sdk-contract.md` with actual SDK surface (add `getActivity`)
- Fix `project.md` to link to `context.md` instead of embedding it verbatim

**Exit criteria**

- Zero visual change
- `npm --prefix frontend run build` passes
- `App.tsx` is under 150 lines

### Phase 0 - IA cleanup (frontend only) - **do second**

- Enforce exclusive content ownership per tab (see §5.1 ownership table)
- Dashboard: strip fund/withdraw/full activity; add deep links to Flows/Activity
- Dashboard: keep quick-withdraw (unlocked balance only, read-only amount display)
- Flows: pipeline + fund wizard + allocation + stream/withdraw only
- Activity: ledger-first; remove health cards, fund/withdraw as primary content
- Add empty states per page (not-connected, no-data)
- Add hash routes: `#/dashboard`, `#/flows`, `#/activity` (~15 lines)
- Quick a11y fixes:
  - Add `aria-expanded` to expandable activity rows
  - Add `role="tab"` + `aria-selected` to filter chips
  - Add skip-to-content link
  - Focus management on tab switch
- Fix async polling bug (replace `forEach(async ...)` with sequential queue or `Promise.allSettled`)
- Preserve visual language
- No new chain work

**Exit criteria**

- Switching tabs feels like three modes of one product, not three skins
- No major panel title appears on more than one page (per §5.1 table)
- Each page has a meaningful empty state for fresh launches
- Hash routes work (shareable demo links)
- Build still passes

### Phase 1 - Flows depth (mock)

- Deposit amount + split preview (using `previewDeposit` mock)
- Hop timeline for active transaction
- Stream physics panel
- Scenario mode: "what if I fund X?" (using mock math from §6.2)
- Upgrade `getActivity` mock to accumulate runtime items
- Add `status` and `txHash` fields to `ActivityItem` type

### Phase 2 - Activity depth (mock)

- Status filters, search, detail drawer with step timeline
- Pending queue board (`pending | confirmed | failed`)
- Copy hash + mock Stellar explorer URL
- CSV export (low effort, high demo credibility — keep as last item)

### Phase 3 - Real Stellar behind the same SDK

Planned contracts:

- `streaming.rs` - timestamp-based employee salary accrual
- `vault.rs` - employer deposits, buffer, withdrawal accounting
- `defindex_router.rs` - DeFindex/Blend routing adapter

Also:

- Replace mock delays with real `getTransactionStatus`
- Passkey / smart account only inside SDK (optional with mock fallback — browser compatibility)
- Scripts: `demo:reset`, seed employer + employee, deploy testnet

Contract notes (from existing `contracts/README.md`):

- `#![no_std]` + `soroban-sdk`
- Prefer `__constructor`
- Typed storage keys with `#[contracttype]`
- Persistent per-user stream state + TTL extension
- Auth at every authority layer
- `i128` amounts; reject negatives
- USDC via Stellar Asset Contract

### Phase 4 - Product polish

- Keyboard nav + `prefers-reduced-motion` (continue existing work)
- Advanced a11y audit
- Optional light settings panel

---

## 11. Priority matrix

| Priority | Item | Impact | Effort | Est. time |
|----------|------|--------|--------|-----------|
| **P0** | File extraction (Phase 0a) | High (unblocks everything) | Low-Med | 2–3 hours |
| **P0** | Mutual exclusive tab content | High | Low-Med | 3–4 hours |
| **P0** | Hash routes + empty states + a11y fixes | Med-High | Low | 1–2 hours |
| **P0** | Fix async polling bug | Med | Low | 30 min |
| **P1** | Flows fund wizard + hop timeline + scenario mode | High | Med | 4–6 hours |
| **P1** | Upgrade `getActivity` mock + `ActivityItem` type | Med | Low | 1–2 hours |
| **P1** | Activity detail drawer + status filters | High | Med | 4–6 hours |
| **P2** | Mock SDK: `previewDeposit`, `getTransactionDetail` | Medium | Low-Med | 2–3 hours |
| **P2** | CSV export | Med | Low | 30 min |
| **P3** | Real contracts + testnet demo scripts | High (long-term) | High | Days |

### Estimated total timeline

| Phase | Est. time |
|-------|-----------|
| 0a (file split) | 2–3 hours |
| 0 (content re-slice + fixes) | 4–6 hours |
| 1 (Flows depth) | 5–8 hours |
| 2 (Activity depth) | 4–6 hours |
| **Total demo-ready** | **~15–23 hours** |

---

## 12. Definition of done

### Tabs are “good” when

- [ ] Dashboard answers health in one screen
- [ ] Flows is the only place to operate the pipeline
- [ ] Activity is the only full history / audit surface
- [ ] Deposit/withdraw/login still create shared activity + update shared stats
- [ ] A new reviewer can explain each tab in one sentence
- [ ] Visual design still matches current cinematic warm system
- [ ] `npm --prefix frontend run build` passes
- [ ] UI still imports only the SDK

### Product is “demo-ready” when

- [ ] Phase 0 + Phase 1 + Phase 2 complete
- [ ] Full narrative (health -> hop -> ledger) works end-to-end on mock
- [ ] Failures (cancelled passkey, failed tx) are visible and recoverable

### Product is “testnet-ready” when

- [ ] Phase 3 contracts + scripts deployed
- [ ] Mock SDK swap path documented
- [ ] Real tx hashes open in explorer

---

## 13. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Tabs still feel duplicated after cleanup | Hard ownership table (§5.1) enforced in PR review |
| Scope creep into redesign | Explicit non-goal; reuse existing CSS tokens |
| SDK surface churn | Treat SDK as contract; sync `sdk-contract.md` before adding new functions |
| Mock ≠ chain behavior | Keep amounts as strings; lifecycle states identical to future real txs |
| Big `App.tsx` becomes unmaintainable | **Phase 0a (file extraction) is now a prerequisite**, not deferred |
| Static mock data blocks Phase 2 | Upgrade `getActivity` to accumulate runtime items in Phase 1 |
| Fresh demo launch shows blank/broken UI | Empty states are now Phase 0, not Phase 4 |

---

## 14. Recommended immediate next step

**Implement Phase 0a first (file extraction), then Phase 0 (IA cleanup):**

1. Extract pages, hooks, and shared components from monolith `App.tsx`
2. Verify zero visual change + build passes
3. Re-slice Dashboard / Flows / Activity content per §5.1 ownership table
4. Add deep links, hash routes, empty states, and a11y fixes
5. Fix async polling bug
6. Sync `docs/sdk-contract.md`; fix `project.md` duplication
7. Verify build
8. Log outcome in `context.md`

After Phase 0 review, proceed to Phase 1 (Flows depth) then Phase 2 (Activity depth).

---

## 15. Open questions — resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | One-job-per-tab vs employer/employee separation? | **Tab split is correct.** Separate apps double the surface for zero demo value. Employer/employee separation is post-hackathon. |
| 2 | Quick withdraw on Dashboard? | **Yes.** Read-only display of unlocked amount + one-click withdraw. Full withdrawal management (locked funds, allocation changes) lives only on Flows. |
| 3 | CSV export worth Phase 2? | **Yes.** ~30 min of work, adds surprising audit credibility. Keep as last item in Phase 2. |
| 4 | Flows pipeline or Activity audit first? | **Flows first.** The money-hop animation is the visual hook. Activity depth is important but less demo-flashy. |
| 5 | Stellar Phase 3 details? | **Testnet only.** Passkeys should be optional with mock fallback — browser compatibility issues will block live demos. |

---

## 16. Related project files

| Path | Role | Notes |
|------|------|-------|
| `frontend/src/App.tsx` | Current monolith UI (1,193 lines) | To be split in Phase 0a |
| `frontend/src/styles.css` | Design system / layout | Keep centralized, do not fork per page |
| `frontend/src/animation-utils.ts` | Motion helpers | |
| `sdk/mock-sdk.ts` | Mock integration | `getActivity` needs runtime accumulation |
| `sdk/types.ts` | Shared types | Needs `status` + `txHash` on `ActivityItem` |
| `docs/sdk-contract.md` | Day-1 UI ↔ chain boundary | **Out of sync** — missing `getActivity` |
| `contracts/README.md` | Planned Soroban work | |
| `scripts/README.md` | Deploy / demo reset plans | |
| `context.md` | Implementation changelog | |
| `project.md` | Project overview | **Fix:** link to `context.md` instead of embedding |

---

## 17. Changelog of this document

| Date | Note |
|------|------|
| 2026-07-19 | Initial review draft from tab-duplication feedback and current codebase state |
| 2026-07-20 | v2: Integrated 13 improvements from code-grounded review — added Phase 0a (file extraction), content ownership table (§5.1), hook decomposition spec, known bugs section (§4), scenario mode math, demo script (§9), time estimates, promoted hash routes/empty states/a11y to Phase 0, resolved all open questions (§15), flagged static mock data + SDK doc drift |

---

**Status: Approved.** Open questions from §15 have been resolved. Proceed with Phase 0a → Phase 0.
