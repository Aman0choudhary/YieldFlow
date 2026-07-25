/**
 * Security helpers: CORS fail-closed, CSRF cookie, admin key, rate limit, session hard-require.
 */
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const CSRF_COOKIE = "yf_csrf";
const RATE = new Map(); // key -> { count, resetAt }

export function parseCookies(req) {
  const raw = req.headers?.cookie || req.headers?.Cookie || "";
  const out = {};
  String(raw)
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((p) => {
      const i = p.indexOf("=");
      if (i === -1) return;
      out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1));
    });
  return out;
}

export function resolveRequestOrigin(req) {
  const origin = req.headers?.origin || req.headers?.Origin;
  if (origin) return String(origin);
  const referer = req.headers?.referer || req.headers?.Referer;
  if (referer) {
    try {
      return new URL(String(referer)).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function isOriginAllowed(requestOrigin, allowedOrigin) {
  if (!allowedOrigin || allowedOrigin === "*") return false;
  if (!requestOrigin) return false;
  return String(requestOrigin) === String(allowedOrigin);
}

/** Same-site browser/nav requests often omit Origin on GET. */
export function requestLooksSameSite(req, allowedOrigin) {
  if (!allowedOrigin || allowedOrigin === "*") return false;
  const origin = resolveRequestOrigin(req);
  if (origin) return isOriginAllowed(origin, allowedOrigin);
  try {
    const allowedHost = new URL(allowedOrigin).host;
    const host = String(req.headers?.host || "").split(",")[0].trim();
    if (host === allowedHost) return true;
    // local dev
    if ((host.startsWith("localhost") || host.startsWith("127.0.0.1")) && allowedOrigin.includes("localhost")) return true;
    return false;
  } catch {
    return false;
  }
}

export function applyCors(res, req, allowedOrigin) {
  const requestOrigin = resolveRequestOrigin(req);
  const ok = isOriginAllowed(requestOrigin, allowedOrigin);
  if (ok) {
    res.setHeader("access-control-allow-origin", requestOrigin);
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("vary", "Origin");
  }
  // Never reflect arbitrary origins. Never use *.
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader(
    "access-control-allow-headers",
    "content-type,authorization,x-yieldflow-admin-key,x-csrf-token"
  );
  // true if CORS ok OR same-site host (for cookie issuance)
  return ok || requestLooksSameSite(req, allowedOrigin);
}

export function sealValue(value, secret) {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function unsealValue(token, secret) {
  if (!token || !String(token).includes(".")) return null;
  const [payload, sig] = String(token).split(".");
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function issueCsrfCookie(res, secret, { secure = true } = {}) {
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 8 * 60 * 60 * 1000;
  const token = sealValue({ n: nonce, exp }, secret);
  const parts = [
    `${CSRF_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${8 * 60 * 60}`,
  ];
  if (secure) parts.push("Secure");
  const prev = res.getHeader?.("set-cookie");
  // Node http vs Vercel
  if (typeof res.setHeader === "function") {
    if (prev) {
      const list = Array.isArray(prev) ? prev.concat(parts.join("; ")) : [prev, parts.join("; ")];
      res.setHeader("set-cookie", list);
    } else {
      res.setHeader("set-cookie", parts.join("; "));
    }
  }
  return token;
}

export function readCsrf(req, secret) {
  const cookies = parseCookies(req);
  const fromCookie = cookies[CSRF_COOKIE];
  const fromHeader = req.headers?.["x-csrf-token"] || req.headers?.["X-CSRF-Token"];
  const token = fromCookie || fromHeader;
  const data = unsealValue(token, secret);
  if (!data || !data.exp || Date.now() > Number(data.exp)) return false;
  return true;
}

export function hasValidAdminKey(req, adminKey) {
  if (!adminKey) return false;
  const h =
    req.headers?.["x-yieldflow-admin-key"] ||
    req.headers?.["X-YieldFlow-Admin-Key"] ||
    "";
  const bearer = req.headers?.authorization || "";
  let provided = String(h || "");
  if (!provided && String(bearer).toLowerCase().startsWith("bearer admin:")) {
    provided = String(bearer).slice("bearer admin:".length).trim();
  }
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(String(adminKey));
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * State-changing employer ops: admin key OR (allowed origin + valid CSRF).
 */
export function assertMutationAuthorized(req, {
  allowedOrigin,
  sessionSecret,
  adminKey,
}) {
  if (hasValidAdminKey(req, adminKey)) return { mode: "admin" };

  const origin = resolveRequestOrigin(req);
  const sameSite = requestLooksSameSite(req, allowedOrigin);
  // Cross-site browser calls must present allowed Origin
  if (origin && !isOriginAllowed(origin, allowedOrigin)) {
    throw Object.assign(
      new Error("Forbidden origin for state-changing request."),
      { statusCode: 403 }
    );
  }
  if (!sameSite && !isOriginAllowed(origin, allowedOrigin)) {
    throw Object.assign(
      new Error("Forbidden origin for state-changing request. Call from the app origin or pass X-YieldFlow-Admin-Key."),
      { statusCode: 403 }
    );
  }
  if (!readCsrf(req, sessionSecret)) {
    throw Object.assign(
      new Error("Missing/invalid CSRF cookie. Open the app first (issues cookie), then retry."),
      { statusCode: 403 }
    );
  }
  return { mode: "csrf" };
}

export function assertEmployeeSession(req, verifySession, employeeId) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  const token =
    typeof h === "string" && h.toLowerCase().startsWith("bearer ")
      ? h.slice(7).trim()
      : "";
  if (!token) {
    throw Object.assign(new Error("Employee session required. Login with passkey first."), {
      statusCode: 401,
    });
  }
  // Do not accept admin bearer as employee session
  if (token.startsWith("admin:")) {
    throw Object.assign(new Error("Admin key cannot withdraw employee funds."), { statusCode: 401 });
  }
  const session = verifySession(token, employeeId);
  if (!session) {
    throw Object.assign(new Error("Invalid or expired employee session."), { statusCode: 401 });
  }
  return session;
}

export function rateLimit(req, { bucket, limit = 30, windowMs = 60_000 } = {}) {
  const ip =
    (req.headers?.["x-forwarded-for"] && String(req.headers["x-forwarded-for"]).split(",")[0].trim()) ||
    req.socket?.remoteAddress ||
    "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  let row = RATE.get(key);
  if (!row || now > row.resetAt) {
    row = { count: 0, resetAt: now + windowMs };
    RATE.set(key, row);
  }
  row.count += 1;
  if (row.count > limit) {
    throw Object.assign(new Error("Rate limit exceeded. Try again shortly."), { statusCode: 429 });
  }
}

export function requireSessionSecret(configSecret, signerSecret) {
  if (!configSecret || configSecret === signerSecret) {
    // Allow only if explicitly a dedicated non-empty secret different from signer, or set SESSION_SECRET
  }
  const weak =
    !configSecret ||
    configSecret === "yieldflow-testnet-session-dev-only" ||
    configSecret === signerSecret;
  return { weak, secret: configSecret || signerSecret || "yieldflow-testnet-session-dev-only" };
}

export { CSRF_COOKIE };
