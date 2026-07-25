/**
 * Browser-side persistence for demo polish.
 * Survives refresh; complements ephemeral serverless activity memory.
 */

export type LocalActivity = {
  id: string;
  kind: "deposit" | "stream" | "yield" | "withdraw" | "auth";
  label: string;
  timestamp: string;
  amount: string;
};

const ACTIVITY_KEY = "yieldflow.activity.v1";
const WITHDRAW_KEY = "yieldflow.withdrawals.v1";

export type LocalWithdrawal = {
  id: string;
  date: string;
  amount: string;
  dest: string;
  status: string;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function loadLocalActivity(): LocalActivity[] {
  return readJson<LocalActivity[]>(ACTIVITY_KEY, []);
}

export function pushLocalActivity(item: LocalActivity) {
  const next = [item, ...loadLocalActivity().filter((a) => a.id !== item.id)].slice(0, 40);
  writeJson(ACTIVITY_KEY, next);
  return next;
}

export function mergeActivity(
  remote: LocalActivity[],
  local: LocalActivity[] = loadLocalActivity()
): LocalActivity[] {
  const map = new Map<string, LocalActivity>();
  for (const item of [...remote, ...local]) {
    if (!item?.id) continue;
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values())
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 40);
}

export function loadLocalWithdrawals(): LocalWithdrawal[] {
  return readJson<LocalWithdrawal[]>(WITHDRAW_KEY, []);
}

export function pushLocalWithdrawal(item: LocalWithdrawal) {
  const next = [item, ...loadLocalWithdrawals().filter((w) => w.id !== item.id)].slice(0, 20);
  writeJson(WITHDRAW_KEY, next);
  return next;
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err || "Unknown error");
  const lower = msg.toLowerCase();

  // Mainnet money ops
  if (lower.includes("admin-key") || lower.includes("admin key") || lower.includes("x-yieldflow-admin-key")) {
    return "Mainnet deposit requires Admin Console unlock (admin API key). Open Menu → 06 ADMIN CONSOLE, unlock, then deposit.";
  }
  if (lower.includes("not within the allowed range") || lower.includes("insufficient")) {
    return "Not enough USDC on the employer/signer account for this deposit. Confirm USDC is on GB65HDY… then try a smaller amount (min $5).";
  }
  // Do NOT match bare "balance" — it rewrote real mainnet errors into fake testnet faucet text.
  if (lower.includes("signer") && (lower.includes("required") || lower.includes("503") || lower.includes("not configured"))) {
    return "Server signer is not configured. Deposit needs YIELDFLOW_SIGNER_SECRET on the API.";
  }
  if (lower.includes("csrf")) {
    return "Security check failed (CSRF). Refresh the page, unlock Admin Console, and retry.";
  }
  if ((lower.includes("unauthorized") || lower.includes("401") || lower.includes("403") || lower.includes("session")) && lower.includes("employee")) {
    return "Employee session expired or unauthorized. Sign in again from the employee portal.";
  }
  if (lower.includes("nothing unlocked")) {
    return "Nothing unlocked yet — wait for the stream to accrue, or create a stream first.";
  }
  if (lower.includes("simulation failed")) {
    return "On-chain simulation failed: " + msg;
  }
  if (lower.includes("gd2x") || lower.includes("testnet faucet")) {
    return "Mainnet uses real Circle USDC on the employer account (GB65HDY…), not the old testnet faucet.";
  }
  return msg;
}
