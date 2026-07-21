/**
 * helpers.js — Shared HTTP helpers for the backend.
 */

/**
 * Set CORS headers on response.
 */
export function setCors(res, allowedOrigin) {
  res.setHeader("access-control-allow-origin", allowedOrigin);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

/**
 * Send a JSON response.
 */
export function json(res, body, statusCode = 200) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Read JSON body from incoming request.
 */
export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

/* ── Token amount helpers (7-decimal USDC) ──────────── */

const TOKEN_DECIMALS = 7;

export function toBaseUnits(amount) {
  const value = normalizeAmount(amount);
  const [whole, fraction = ""] = value.split(".");
  const scale = 10n ** BigInt(TOKEN_DECIMALS);
  const paddedFraction = `${fraction}${"0".repeat(TOKEN_DECIMALS)}`.slice(0, TOKEN_DECIMALS);
  return BigInt(whole) * scale + BigInt(paddedFraction || "0");
}

export function fromBaseUnits(value) {
  const raw = BigInt(value || 0);
  const scale = 10n ** BigInt(TOKEN_DECIMALS);
  const whole = raw / scale;
  const fraction = String(raw % scale).padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function normalizeAmount(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Amount must be a positive decimal number.");
  }
  return normalized;
}

/**
 * Format seconds-remaining as a human-readable countdown.
 */
export function formatNextPayday(endTime) {
  const seconds = Number(endTime || 0) - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return "Complete";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
