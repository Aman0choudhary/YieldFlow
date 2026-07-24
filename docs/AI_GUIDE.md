# AI Guide (Groq)

## Server env only (never VITE_*)
- `YIELDFLOW_AI_API_KEY` — Groq key (`gsk_...`)
- `YIELDFLOW_AI_PROVIDER=groq`
- `YIELDFLOW_AI_BASE_URL=https://api.groq.com/openai/v1`
- `YIELDFLOW_AI_MODEL=llama-3.3-70b-versatile`

## Security
- Key only on server
- Guide refuses secret/key extraction prompts
- Provider errors redacted
- Rate limited + CSRF/same-site for browser

## Endpoint
`POST /api/guide` `{ "message": "...", "history": [...] }`

## Fallback
If Groq is down, built-in product answers still work.
