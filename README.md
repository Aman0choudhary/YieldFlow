# YieldFlow

**Streaming payroll on Stellar** — employers deposit USDC once; capital splits into a liquid buffer + Blend yield; employees unlock wages per-second and withdraw with a device passkey.

**Live:** https://yieldflow-frontend.vercel.app/

## Stack (short)

| Layer | Tech |
|-------|------|
| Chain | Stellar + Soroban |
| Contracts | Rust vault + streaming (`soroban-sdk`) |
| Yield | Blend (direct); DeFindex as strategy reference |
| Token | Circle USDC (SAC) |
| API | Vercel serverless (`frontend/api`) |
| Auth | WebAuthn passkeys (SimpleWebAuthn) |
| UI | React 19 + TypeScript + Vite |

## Repo layout

```
contracts/     Soroban vault + streaming
frontend/      UI + serverless API (primary app)
docs/          Technical notes (see docs/README.md)
deployments/   Network deployment records
scripts/       Deploy / ops helpers
```

## Quick start (local)

```bash
cd frontend
npm install
npm run dev
```

Set env from `frontend/.env.example` (never commit secrets).

## Mainnet contracts

See `deployments/mainnet.json` for live IDs.

## Docs for judges

Start here: **[docs/JUDGE_TECH_QA.md](docs/JUDGE_TECH_QA.md)** — stack, architecture, security, likely Q&A.

Other files under `docs/` are internal ops notes (not required reading for product review).

## Security

- No private keys in the frontend bundle
- Employee withdraw requires passkey session
- Mainnet money ops require admin key
- Report issues privately; do not open issues with secrets

## License

Private / hackathon project unless otherwise stated.
