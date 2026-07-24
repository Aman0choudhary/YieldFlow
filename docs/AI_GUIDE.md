# AI Guide (Gemini)

## Setup (server only)
Vercel env (never `VITE_*`):
- `YIELDFLOW_AI_API_KEY` — Google AI Studio key
- `YIELDFLOW_AI_PROVIDER=gemini`
- `YIELDFLOW_AI_MODEL=gemini-2.0-flash` (or `gemini-1.5-flash`)

## Security
- Key only on server
- Guide refuses secret/key extraction prompts
- Provider errors are redacted
- Rate limited
- CSRF / same-site required for browser calls

## Endpoint
`POST /api/guide` with `{ "message": "...", "history": [...] }`

## Fallback
If Gemini quota/key/network fails, built-in product answers still work.
