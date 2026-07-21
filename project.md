# YieldFlow Project Overview

## Overview

This repository contains the YieldFlow demo implementation and frontend powered by a mock SDK. The codebase is structured to separate the frontend (Vite + React + TypeScript), SDK interfaces (mock and wiring), deployment scripts, and documentation.

The project focuses on simulating payroll deposits, passkey login flows, transaction lifecycle, and animated UI interactions without making real Stellar network calls in UI components.

## Key Files & Folders

- `context.md` — Implementation context and changelog notes.
- `package.json` — Top-level package manifest.
- `README.md` — Quick-start notes and developer guidance.
- `config/` — Configuration files (e.g., `testnet-usdc.json`).
- `contracts/` — Contract-related notes and artifacts.
- `docs/` — Documentation (e.g., `sdk-contract.md`).
- `frontend/` — Vite + React app and UI code.
  - `frontend/index.html`
  - `frontend/package.json`
  - `frontend/tsconfig.json`
  - `frontend/vite.config.ts`
  - `frontend/src/` — contains `App.tsx`, `main.tsx`, `styles.css`, `animation-utils.ts` and `sdk/` imports.
- `scripts/` — Deployment and helper PowerShell scripts (e.g., `deploy-testnet.ps1`).
- `sdk/` — SDK implementations and types (e.g., `mock-sdk.ts`, `yieldflow-sdk.ts`, `types.ts`).

## Purpose & Behavior

- Mock SDK: Provides simulated async delays, transaction hashes, pending-to-confirmed transitions, passkey login simulation, and live salary balance math for local development and demos.
- UI: Animated, accessible, and responsive components demonstrating payroll and yield visualizations.
- No direct Stellar calls in UI components — network integrations are isolated in SDK layers.

## How to run (developer notes)

- Install dependencies (top-level or per-folder as needed):

  ```bash
  npm install
  npm --prefix frontend install
  ```

- Run the frontend dev server:

  ```bash
  npm --prefix frontend run dev
  ```

- Build the frontend for production:

  ```bash
  npm --prefix frontend run build
  ```

## Changelog / Implementation Context (from `context.md`)

The following notes were extracted verbatim from `context.md`.

```markdown
# YieldFlow Implementation Context

## 2026-07-17

- Confirmed the supplied UI is static HTML, so the implementation will create a real React app around the same visual language.

- Money values move through the app as strings, with display parsing limited to UI formatting and mock animations.

- Lock the mock SDK interface and wire the React UI to it.

- Mock SDK includes async delays, transaction hashes, pending-to-confirmed transitions, passkey login simulation, and live salary balance math.

- Added transaction lifecycle handling for deposits, passkey login, and withdrawals without direct Stellar calls in UI components.

- Kept decorative colors restricted to the approved warm palette.

- `npm install` completed with zero reported vulnerabilities.

---

## 2026-07-17 — Workspace inspection

- Action: Inspected core frontend and SDK files to verify the mock SDK interface and React wiring.
- Files reviewed: `frontend/src/App.tsx`, `sdk/mock-sdk.ts`, `sdk/yieldflow-sdk.ts`, `sdk/types.ts`, `frontend/package.json`.
- Findings: Mock SDK implements `connectEmployer`, `depositPayroll`, `getEmployerStats`, `restoreEmployeeSession`, `loginEmployee`, `getEmployeeBalance`, `withdraw`, `getTransactionStatus`, and `getActivity`. `frontend` is Vite + React + TypeScript and imports the SDK via `./sdk/yieldflow-sdk`.
- Next: Add developer README and start implementing incremental UI wiring and test flows; log each change here.

---

## 2026-07-17 — Added README and updated todo list

- Action: Added top-level `README.md` with quick-start commands and notes about the mock SDK.
- Files changed: `README.md` added at project root.
- Next: Run a quick static type check in the frontend and verify the dev server starts.

---

## 2026-07-17 — UI animations + alignment polish

- Action: Integrated premium motion/microinteractions without redesigning layout, palette, or hierarchy. Fixed alignment bugs from prior edits.
- Fixes: broken progress width, mojibake labels, panel padding consistency, 12-col grid gaps, toast stack styles, tabular metrics.
- Motion: staggered page entrance, metric count-up + value pulse, live salary stream glow/progress, treasury allocation bar animation, activity insert + filters + expand, tx-connected activity/toasts/badge, button ripple/success/error shake, skeleton boot, yield bar animation, reduced-motion support.
- Files: `frontend/src/App.tsx`, `frontend/src/animation-utils.ts`, `frontend/src/styles.css`.
- Verify: `npm --prefix frontend run build` passed (tsc + vite).

```

## Notes & Next Steps

- Consider adding a developer `CONTRIBUTING.md` and an explicit `DEV.md` with local dev commands, test guidance, and SDK extension notes.
- If you want, I can run a local type-check or start the dev server next.
