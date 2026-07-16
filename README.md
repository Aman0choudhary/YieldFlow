# YieldFlow — Frontend Demo

This workspace contains the YieldFlow demo frontend and a locked mock SDK for local development.

Quick start

1. Install dependencies (root and frontend):

```bash
npm install
npm --prefix frontend install
```

2. Run the dev server (starts the frontend Vite dev server):

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
npm --prefix frontend run build
```

Notes
- The frontend uses a mock SDK at `sdk/mock-sdk.ts`. The React app imports the SDK via `frontend/src/sdk/yieldflow-sdk.ts`.
- See `context.md` for implementation notes and the project change log.
