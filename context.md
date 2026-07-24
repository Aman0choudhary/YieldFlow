# YieldFlow — Dragonfly.xyz Redesign Context & Implementation Summary

## 1. Project Overview
YieldFlow is a real-time streaming payroll protocol built on Stellar and Soroban. This context document captures the full frontend overhaul inspired by **Dragonfly.xyz**'s structural DNA, WebGL particle atmosphere, numbered section headers, and dark editorial aesthetic.

- **Repository**: [https://github.com/Aman0choudhary/YieldFlow](https://github.com/Aman0choudhary/YieldFlow)
- **Active Branch**: `Aman-frontend-new` (Pushed & tracking `origin/Aman-frontend-new`)

---

## 2. Technical Stack & Dependencies
- **Core Framework**: React 19, Vite 8, TypeScript 6
- **3D / WebGL Engine**: Three.js (`^0.185.1`), `@react-three/fiber` (`^9.6.1`), `@react-three/drei` (`^10.7.7`)
- **Smooth Scrolling**: `@studio-freight/lenis` (`^1.0.42`) synced with GSAP
- **Scroll Animations**: GSAP (`^3.15.0`) with `ScrollTrigger` plugin
- **Blockchain SDK**: `@stellar/stellar-sdk` (`^14.5.0`)

---

## 3. UI & Architectural Specifications

### A. WebGL Background (`src/components/Background.tsx`)
- **Particle System**: Single `BufferGeometry` containing 12,000 dense ambient points distributed in a 3D box.
- **Shader FX**: Custom vertex shader creating smooth fluid/cosmic-dust drift motion (`sin`/`cos` waveforms) with mouse position lerp parallax.
- **Styling**: Monochromatic metallic silver/gray dot & ASCII `+` cross texture (`gl_PointSize` size attenuation, additive blending, near-black `#07090b` canvas container).

### B. Fixed Top Header & Navigation (`src/components/Layout.tsx`)
- **Pinned Top Bar**: `position: fixed`, `top: 0`, `z-index: 500`, dark backdrop blur (`backdrop-filter: blur(10px)`).
- **Unified Center Trigger Box**: A single, sharp square box (`border-radius: 0px`, `border: 1px solid var(--grey-200)`) centered horizontally (`left: 50%`, `transform: translateX(-50%)`).
  - Contains: `>|<` | 5 orange square dots (`:::::`) | `MENU` (or `CLOSE [✕]`).
- **Left Logo & Back Button**: Displays `YieldFlow` gradient logo. When navigating inside sub-views (`employer`, `employee`, `approvals`), a persistent `← BACK HOME` button automatically appears.

### C. Menu Drawer Overlay (`src/components/MenuOverlay.tsx`)
- **Overlay Drawer**: Pinned below header (`top: 65px`), centered on screen with backdrop blur.
- **Numbered Menu Items**:
  - `01 ABOUT YIELDFLOW` (Triggers interactive "About Product" modal)
  - `02 LANDING & MECHANICS` (`login`)
  - `03 EMPLOYER TREASURY VAULT` (`employer`)
  - `04 EMPLOYEE STREAMING PORTAL` (`employee`)
  - `05 APPROVALS & AUTHORIZATIONS` (`approvals`)
- **Footer Elements**: Monospaced ASCII matrix protocol statement, `ABOUT PRODUCT` & `CONTRACT INFO` action triggers, and a tri-color bottom accent strip (`Orange / Pink / Purple`).

### D. Numbered Section Shell (`src/components/SectionHeader.tsx`)
- Reusable `<SectionHeader index="01" eyebrow="LABEL" thesis="..." paragraph="..." />` component.
- Large mono index number (`01`, `02`), all-caps eyebrow label, display-type serif thesis, and supporting paragraph slot.
- Staggered GSAP `.slide-up` ScrollTrigger entrance animations.

---

## 4. Page Breakdown

1. **`LoginScreen.tsx` (Landing Page)**:
   - Hero section with large `YieldFlow` title and CTAs.
   - `01 ABOUT`: Core thesis on idle payroll drag.
   - `02 MECHANICS`: 3-step grid (`Deposit` → `Yield Route` → `Stream & Withdraw`).
   - `03 ECOSYSTEM`: Integrations grid (Stellar, Soroban, DeFindex, Blend, Passkey Kit, OpenZeppelin Relayer).
   - `04 SITEMAP`: 3-column footer navigation + oversized `YF` wordmark.

2. **`EmployerDashboard.tsx` (Treasury Vault)**:
   - `01 TREASURY VAULT`: Total vault pool, yield harvested, instant buffer vs. yield allocation split bar.
   - `02 PERFORMANCE`: Real-time SVG line chart showing APY yield accumulation curve.
   - `03 LEDGER`: Recent transaction table for deposits, yield harvests, and worker outflows.
   - `04 STREAM METRICS`: Headcount, total streamed to date, and buffer efficiency metrics.

3. **`EmployeeBalance.tsx` (Worker Portal)**:
   - `01 LIVE EARNINGS STREAM`: Live real-time counter (`AnimatedDigit` flip-down animation) streaming per-second wages with instant withdrawal CTA.
   - `02 SETTLEMENTS`: Past instant withdrawal claims table.
   - `03 HOW YOU EARN`: Plain-language yield subsidization explainer grid.
   - `04 SECURITY`: Hardware Passkey authentication status and linked devices list.

4. **`ApprovalScreen.tsx` (Stream Authorizations)**:
   - `01 STREAM AUTHORIZATION`: Dragonfly "Show Bio" style expandable detail cards for pending workers (shows monthly allocation, hourly rate, Soroban wallet, passkey status).
   - `02 AUDIT LOG`: Multisig approval history ledger table.

---

## 5. Git Branch & Commit History

**Branch Name**: `Aman-frontend-new`

- **Commit 1 (`b5b0b45`)**: `feat(frontend): set up WebGL ambient particle field background and asset configs`
- **Commit 2 (`bded890`)**: `feat(frontend): add Dragonfly numbered section headers, menu drawer overlay, and layout shell`
- **Commit 3 (`737945f`)**: `feat(frontend): expand landing page with numbered mechanics, ecosystem, and footer sitemap`
- **Commit 4 (`d3e4116`)**: `feat(frontend): implement treasury analytics, worker streaming portal, approvals detail cards, and navigation`

---

## 6. Next Steps for Integration with Real Soroban Backend

1. **Merge Branch**:
   - Merge `Aman-frontend-new` into `main` via PR: [https://github.com/Aman0choudhary/YieldFlow/pull/new/Aman-frontend-new](https://github.com/Aman0choudhary/YieldFlow/pull/new/Aman-frontend-new)

2. **Connect SDK**:
   - Open `frontend/src/sdk/yieldflow-sdk.ts` and replace mock return objects in `getEmployerStats()`, `getEmployeeBalance()`, `approveEmployeePeriod()` with real `@stellar/stellar-sdk` Soroban contract calls.

3. **Verify Build**:
   - Run `npm run build` inside `frontend/` to confirm clean compilation.
