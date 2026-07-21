# YieldFlow v2 — Product Requirements Document

**Version:** 2.1 (execution-ready)  
**Status:** Approved direction for current repo  
**Product:** YieldFlow  
**Network:** Stellar (mock-first, SDK-gated)  
**Platform:** Web (desktop-first, responsive mobile)  
**Date:** 2026-07-21  
**Supersedes for execution:** broad v2 experience wishlist  
**Works with:** `update.md`, `YIELD_FLOW_IMPROVEMENT_PLAN.md`, `docs/sdk-contract.md`

---

## 1. One-line product

YieldFlow lets employers deposit payroll once, stream salaries continuously to employees, and earn yield on undistributed payroll — with blockchain complexity fully hidden.

---

## 2. Vision

YieldFlow should feel like a **living payroll operating system**, not a generic SaaS dashboard.

Users never manage:

- seed phrases
- gas fees
- raw wallets as a primary UX
- opaque chain jargon

They experience:

- deposit payroll
- watch money allocate and stream
- withdraw unlocked earnings
- prove every movement in an audit ledger

**Comparable quality bar:** Stripe, Mercury, Linear, Brex, Ramp — not a crypto landing-page dashboard.

**Guiding message:**

> Money never stops working.

---

## 3. Design principles

Every screen should feel:

1. **Alive** — balances and statuses update with clear live signals  
2. **Trustworthy** — money actions are confirmable, reversible in UX language, and auditable  
3. **Transparent** — users always know where capital sits (treasury / yield / stream / wallet)  
4. **Effortless** — passkey auth, minimal steps, no chain ceremony  
5. **Operational** — each page has one job; no duplicate “second product” panels  
6. **Restrained premium** — motion supports understanding; it never replaces clarity  

### Hard UX rules

- Prefer clarity over particle theater  
- Prefer receipts over toasts alone  
- Prefer tables for audit over social feeds  
- Prefer one primary action per surface  
- Respect `prefers-reduced-motion`  
- Keep the existing warm cinematic design system (no full visual redesign)

---

## 4. Goals

### Business / demo goals

- Explain streaming payroll in under 10 seconds  
- Make employer value obvious (idle payroll can earn yield)  
- Make employee value obvious (salary unlocks continuously)  
- Create a memorable 2–3 minute demo narrative  
- Leave a clean path to real Stellar settlement later  

### Product goals

- Every important metric can update live  
- Every money movement has a visible lifecycle  
- Every page answers a different user question  
- Every deposit / withdraw / login is reflectable in the ledger  
- UI never talks to Stellar directly — only via SDK  

### Non-goals (v2 execution window)

- Full visual redesign / new brand system  
- Separate employer app and employee app  
- Real multi-tenant org / RBAC admin suite  
- AI insights  
- Multi-treasury departments/regions  
- Native-app gesture systems  
- Real Stellar RPC calls inside React components  
- Building features on top of the old monolith without wiring pages first  

---

## 5. Current product truth (code-grounded)

### What exists and works

- Vite + React + TypeScript frontend  
- Warm cinematic design system and motion helpers  
- Mock SDK with deposit, withdraw, passkey login, balances, tx lifecycle  
- Activity persistence in `localStorage`  
- Advanced page implementations under `frontend/src/pages/`  
- Shared hooks under `frontend/src/hooks/`  
- Extended mock APIs: `previewDeposit`, `getStreamPhysics`, `getTransactionDetail`, `getFlowGraph`, `resetDemo`  
- Contract stubs planned: streaming, vault, defindex_router  

### What is broken / incomplete

| Issue | Why it matters |
|---|---|
| `App.tsx` still runs a large monolith UI | Advanced pages/hooks are not the live product |
| Dual frontend risk | Building “v2 polish” on the old path wastes work |
| Tab ownership incomplete in live UI | Product still feels like basic SaaS |
| Activity can be dual-sourced | SDK localStorage + React push can desync |
| No real chain yet | Demo must stay mock-complete and trustworthy |
| No real employee directory / time-series DB | Analytics/search/heatmap must wait |

### Important architecture fact

There is **no traditional database**.

Current data plane:

- SDK types as domain model  
- mock persistence via `localStorage`  
- React state for session/UI  
- future chain state behind `sdk/stellar-sdk.ts`  

v2 must improve the **product surface and state integrity**, not invent a backend.

---

## 6. Users and jobs

### Employer finance operator

**Jobs**

- Fund payroll  
- Understand treasury allocation (buffer vs yield)  
- Confirm employees are streaming  
- Trust that settlement is auditable  

### Employee

**Jobs**

- Sign in with passkey  
- See unlocked balance rising live  
- Withdraw available funds  
- Review personal settlement history  

### Demo reviewer / judge

**Jobs**

- Understand product in 10 seconds  
- Complete health → operate → audit path in 2–3 minutes  
- Believe this can become real Stellar infrastructure  

---

## 7. Information architecture (non-negotiable)

| Tab | Job | User question |
|---|---|---|
| **Dashboard** | Command center | Am I healthy right now? |
| **Flows** | Capital pipeline ops | How does money move, and can I operate it? |
| **Activity** | Settlement ledger | What happened, and can I prove it? |

### Ownership table

| Capability | Owner | Elsewhere |
|---|---|---|
| Fund payroll | Flows | Dashboard deep link only |
| Full withdraw management | Flows | Dashboard may keep unlocked quick-withdraw |
| Live stream controls / physics | Flows | Dashboard read-only summary |
| Allocation policy | Flows | nowhere else |
| Passkey login | Dashboard | Flows prompt to sign in |
| Full ledger / search / export | Activity | Dashboard last 3 events only |
| Tx queue board | Activity | Flows shows current op hops only |
| Pipeline canvas | Flows | Dashboard mini-map read-only |

**PR rule:** no major panel title on more than one page.

---

## 8. Experience requirements by surface

### 8.1 App shell

Must provide:

- sticky top navigation (current pill nav is fine for v2)  
- live status pill (network/mock mode/session)  
- page header using one-job copy  
- toast stack for transient feedback  
- hash routes: `#/dashboard`, `#/flows`, `#/activity`  
- optional compact settings/reset control for demos  

Must not:

- rebuild into a full sidebar OS unless time remains after core  
- mix marketing-hero density with ops controls on the same screen without hierarchy  

### 8.2 Dashboard — living health

**Purpose:** scannable system health in ~5 seconds.

**Required**

- KPI cards: total pool, yield earned, buffer reserve, active employees  
- live stream summary (read-only) with streaming badge when active  
- session / passkey panel  
- last 3 ledger events + “View all”  
- deep links: Open Flows / Open Activity  
- optional unlocked quick-withdraw  

**Premium living layer (after wiring)**

- smooth number transitions on KPIs and live balance  
- treasury breakdown cards: Available / Streaming / Locked / Yield  
- compact health strip:
  - Treasury
  - Stream engine
  - Settlement queue
  - Network (mock/testnet)
  - states: Healthy / Warning / Error  

**Not on Dashboard**

- full fund wizard  
- full allocation editor  
- full ledger table  
- analytics suite  

### 8.3 Flows — money movement engine

**Purpose:** operate and narrate capital hops.

**Required**

- pipeline canvas: Employer → Treasury/Vault → Buffer/Yield → Stream → Employee wallet  
- fund payroll wizard with amount input  
- deposit split preview (buffer vs yield) via `previewDeposit`  
- active transaction hop timeline  
- stream engine panel via `getStreamPhysics`  
- withdraw / exit path with unlocked vs locked clarity  
- scenario mode: “If I fund $X…”  

**Premium living layer**

- nodes light up from real session/tx state  
- current hop pulse for in-flight tx  
- confirm step before fund/withdraw  
- success receipt with amount, route split, hash, CTA to Activity  

**Not on Flows**

- full historical ledger  
- health KPI wall  
- global search  

### 8.4 Activity — audit ledger

**Purpose:** proof, not social feed.

**Required**

- ledger list/table of events  
- filters by kind and status  
- search by hash / amount / label / counterparty  
- detail drawer with step timeline (`getTransactionDetail`)  
- pending / confirmed / failed queue board  
- copy hash + mock explorer link  
- CSV export  

**Premium living layer**

- status badges with semantic color  
- integrity strip (pending/failed/last confirmed counts)  
- “Replay on Flows” deep link from deposit/withdraw rows  
- row receipts that feel bank-grade  

**Not on Activity**

- fund/withdraw primary controls as main content  
- treasury charts as primary content  

---

## 9. Core user journeys

### Journey A — Demo narrative (must pass)

Target: **2–3 minutes**

1. Land on Dashboard → understand health immediately  
2. Sign in with Passkey  
3. See live salary stream ticking  
4. Go to Flows → fund payroll  
5. Watch hop lifecycle pending → confirmed  
6. Request payout  
7. Open Activity → both events visible, open detail, optional CSV  

### Journey B — Employer value

1. Open Flows scenario calculator / savings framing  
2. Enter payroll amount  
3. See buffer/yield split and projected APY impact  
4. Fund and confirm  

### Journey C — Employee value

1. Passkey sign-in  
2. Watch unlocked balance increase  
3. Withdraw available amount  
4. Receive receipt and ledger proof  

### Journey D — Failure recovery

1. Cancelled passkey or failed tx  
2. Clear error state  
3. Retry path without dead-end UI  

---

## 10. Domain model (minimum)

No external DB required for v2. These objects must be consistent in SDK + UI:

### EmployerStats

- totalPool  
- yieldEarned  
- bufferAmount  
- bufferPercent  
- yieldRoutePercent  
- activeEmployees  
- projectedApy  

### EmployeeSession / EmployeeBalance

- employeeId, name, walletAddress  
- unlockedAmount, ratePerSecond, totalStreamed, streamCap, nextPayday  

### ActivityItem

- id, kind, label, timestamp, amount  
- status, txHash, counterparty, createdAt  

### Transaction lifecycle

`idle → authenticating/building → submitted → pending → confirmed | failed`

### Derived / helper models already in SDK

- DepositPreview  
- StreamPhysics  
- TransactionDetail  
- FlowNode  

### Explicitly deferred objects

- multi-employee directory records  
- pay-run entities with approvals  
- daily earnings time-series for heatmaps  
- org/team roles  

---

## 11. Technical requirements

### SDK boundary

- Frontend imports only SDK surface  
- Default: `sdk/mock-sdk.ts`  
- Future swap: `sdk/stellar-sdk.ts` with same exports  
- Amounts remain strings across boundary  

### State integrity rules

1. Runtime money events written by SDK are source of truth for history  
2. UI mirrors via `getActivity` and status polling  
3. Avoid duplicate independent activity writers when possible  
4. Deposit/withdraw update shared stats/balance models once  
5. Tabs are presentation layers over shared state  

### Frontend structure target

```text
frontend/src/
  App.tsx                 # shell only: nav, providers, page switch, shared handlers
  pages/
    Dashboard.tsx
    Flows.tsx
    Activity.tsx
  hooks/
    useSession.ts
    useStats.ts
    useStreamBalance.ts
    useTransactions.ts
    useActivity.ts
    useNotifications.ts
  components/
    activity/
    flows/
    metrics/
    layout/               # optional PageHeader, HealthStrip, ConfirmDialog
  styles.css
  utils.ts
  types.ts
```

### Performance / a11y

- 60fps target on common hardware for existing motion  
- no unbounded intervals without cleanup  
- tx polling must not race itself  
- filter chips and expandable rows must be accessible  
- reduced-motion disables nonessential animation  

### Mobile

- responsive layout required  
- bottom-nav / swipe gesture system not required for v2  

---

## 12. Premium feel without redesign

v2 premium comes from these upgrades only:

| Lever | Example |
|---|---|
| Structure | one job per tab, page headers, deep links |
| Language | Fund pay run, Settlement status, Audit trail |
| Live truth | streaming ticker, hop timeline, health strip |
| Trust | confirm → progress → receipt |
| Audit | ledger table, detail drawer, export |
| Restraint | motion on value change, not constant noise |

### Motion policy

**Allowed / encouraged**

- metric count-up  
- live balance ticks  
- hop step transitions  
- button progress / success / error  
- skeleton boot  
- subtle value pulse on change  

**Deferred**

- continuous particle fields through bars  
- heavy background simulation  
- animation for its own sake on every card  

---

## 13. Phased delivery (execution order)

### Phase 0 — Integration foundation (P0)

**Goal:** make the advanced product the live product.

Deliverables:

- Wire `App.tsx` to existing pages + hooks  
- Remove live duplicated monolith page UI  
- Boot from SDK stats/activity/session  
- Hash routing  
- Shared deposit/withdraw/login handlers  
- Single activity truth path  
- Build passes  

**Exit criteria**

- [ ] `App.tsx` is shell-sized  
- [ ] Dashboard/Flows/Activity pages are what users see  
- [ ] No intentional visual redesign required  
- [ ] Demo login/deposit/withdraw path works on wired pages  

**Estimate:** 3–6 hours

---

### Phase 1 — Product IA + living core (P1)

**Goal:** professional payroll product structure + live system feel.

Deliverables:

- enforce tab ownership table  
- page headers / empty states  
- treasury breakdown on Dashboard  
- health strip  
- Flows confirm + receipt for money actions  
- hop timeline polish from real tx state  
- Activity status badges + integrity strip  
- a11y fixes on tabs/rows  
- polling robustness on live path  

**Exit criteria**

- [ ] each tab explainable in one sentence  
- [ ] live stream is obvious  
- [ ] money actions feel trustworthy  
- [ ] reviewer can complete Journey A  

**Estimate:** 1–2 days

---

### Phase 2 — Demo conversion layer (P2)

**Goal:** maximize understanding and wow without new product domains.

Deliverables:

- employer savings / scenario calculator polish  
- demo reset control clearly available  
- stronger success/empty/error copy  
- optional lightweight marketing hero section only if needed for judges  
- CSV export reliability  

**Exit criteria**

- [ ] employer value understandable without narration  
- [ ] demo can be reset cleanly  
- [ ] Activity feels audit-grade  

**Estimate:** 0.5–1 day

---

### Phase 3 — Stellar readiness (P3)

**Goal:** replace mock settlement without rewriting UI.

Deliverables:

- implement real SDK methods behind same contracts  
- streaming / vault / router integration path  
- testnet scripts and verify flow  
- keep mock fallback for demos  

**Exit criteria**

- [ ] UI unchanged except data source  
- [ ] real tx hashes open in explorer  
- [ ] failure states still handled  

**Estimate:** days (separate track)

---

### Phase 4 — Deferred premium expansions

Only after Phases 0–2 are solid:

- broader analytics charts with real history  
- employee earnings calendar/heatmap  
- command palette  
- global search across entities  
- richer notification center  
- multi-employee management  
- landing-page microsite polish  
- AI insights  
- multi-treasury / RBAC  

---

## 14. Explicit cut list (not in active v2 scope)

Do **not** build now:

- particle systems as primary visual dependency  
- full analytics suite  
- GitHub-style earnings heatmap  
- command palette as required feature  
- global search across wallets/employees/payroll objects we do not model yet  
- AI allocation advisor  
- team invite/permissions  
- multi-org treasury graph  
- native mobile gesture paradigm  

These remain valid future enhancements, not current commitments.

---

## 15. Success metrics

### Product

- New reviewer understands streaming payroll in under 10 seconds  
- Journey A completable in under 3 minutes  
- Each tab has a distinct job (manual review checklist)  
- Money actions always show pending and terminal states  
- Dashboard feels live without confusion  

### Technical

- `npm --prefix frontend run build` passes  
- UI imports only SDK  
- no dual live page implementations  
- reduced-motion safe  
- activity history survives refresh via mock persistence  

### Demo

- health → fund → hop → withdraw → audit story is narratable without apology  
- failures are visible and recoverable  
- design still matches existing warm cinematic system  

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Building polish on dead monolith path | Phase 0 wiring first, mandatory |
| Scope creep into redesign | non-goals + cut list enforced |
| Animation hides weak IA | ownership table before motion density |
| Activity desync | SDK history as source of truth |
| Fake analytics without history | defer charts until data exists |
| Chain work too early | mock demo-ready before Phase 3 |
| “Premium” becomes noisy | motion policy + trust-first reviews |

---

## 17. Decision log

| Decision | Choice | Why |
|---|---|---|
| App structure | 3 tabs, not separate employer/employee apps | fastest coherent demo |
| Visual system | keep current warm cinematic UI | already strong; redesign delays value |
| Next engineering step | wire pages/hooks before new visuals | advanced code already exists unused |
| Premium definition | structure + live truth + trust + audit | matches real fintech quality |
| Data plane | mock SDK + localStorage, no new DB | correct for current stage |
| Analytics / AI / RBAC | future | need domain depth first |

---

## 18. Immediate next actions

1. Execute **Phase 0**: wire `App.tsx` to `pages/*` + `hooks/*`  
2. Delete or isolate dead monolith render path  
3. Verify Journey A on the wired app  
4. Then Phase 1 living core + trust UI  
5. Log progress in `context.md`  
6. Keep this PRD and `update.md` aligned; if they conflict, **this PRD v2.1 wins for scope**, `update.md` remains useful for tactical sequencing detail  

---

## 19. Definition of done for YieldFlow v2 (active scope)

YieldFlow v2 is done when:

1. The live app is the advanced page architecture (not the old monolith)  
2. Dashboard / Flows / Activity each have one clear job  
3. Live streaming and treasury health are obvious  
4. Fund and withdraw are confirmable, trackable, and receipted  
5. Activity is an audit ledger with detail and export  
6. The 2–3 minute demo narrative is reliable on mock  
7. Design system remains intact  
8. Path to real Stellar SDK swap is unchanged and clean  

---

## 20. Final principle

Do not ship a prettier generic dashboard.

Ship a **credible payroll settlement product** that feels alive because money is actually moving through a clear system:

```text
Employer deposit
  → treasury allocation
  → yield + buffer
  → continuous employee stream
  → withdrawal
  → audit proof
```

Every feature either strengthens that loop or waits.

**Status:** Ready for Phase 0 execution.
