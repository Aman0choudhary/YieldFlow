# YieldFlow

**Streaming payroll on Stellar** — employers deposit USDC once; capital splits into a liquid buffer + Blend yield; employees unlock wages per-second and withdraw with a device passkey.

**Live:** https://yieldflow-frontend.vercel.app/

## Stack (short)

| Layer | Tech |
|-------|------|
| Chain | Stellar + Soroban |
| Contracts | Rust vault + streaming (`soroban-sdk` v25) |
| Yield | Blend FixedV2 (direct); DeFindex as strategy reference |
| Token | Circle USDC (SAC) |
| API | Vercel serverless (`frontend/api`) |
| Auth | WebAuthn passkeys (SimpleWebAuthn) |
| UI | React 19 + TypeScript + Vite |
| AI guide | Groq (server-side) |

## Technical docs

Start here: **[docs/TECH_STACK.md](docs/TECH_STACK.md)** — full stack, architecture, contracts, API, and security model.

## Repo layout

```
contracts/     Soroban vault + streaming
frontend/      UI + serverless API (primary app)
docs/          Public technical documentation
deployments/   Network deployment records
config/        Network / protocol catalogs
scripts/       Deploy / ops helpers
sdk/           Generated contract bindings
```

## Quick start (local)

```bash
cd frontend
npm install
npm run dev
```

Set secrets only in local env / Vercel (never commit them). See `backend/.env.example` for variable names.

## Mainnet contracts

See `deployments/mainnet.json` for live vault, streaming, Blend, and USDC IDs.

## Security

- No private keys in the frontend bundle
- Employee withdraw requires a passkey session
- Privileged money ops are gated (CSRF / admin)
- Report issues privately; do not open issues with secrets

## License

Private / hackathon project unless otherwise stated.
