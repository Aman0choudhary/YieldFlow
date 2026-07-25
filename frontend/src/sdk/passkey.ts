/**
 * Browser WebAuthn (Passkey) client for YieldFlow employee auth.
 */
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const CRED_SEAL_KEY = "yieldflow.passkey.credentialSeal";
const NETWORK_KEY = "yieldflow.networkLabel";
const SESSION_KEY = "yieldflow.employeeId";
const SESSION_TOKEN_KEY = "yieldflow.sessionToken";

export function passkeySupported(): boolean {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

export function loadCredentialSeal(): string | null {
  try {
    return localStorage.getItem(CRED_SEAL_KEY);
  } catch {
    return null;
  }
}

export function saveCredentialSeal(seal: string) {
  try {
    localStorage.setItem(CRED_SEAL_KEY, seal);
  } catch {
    /* ignore */
  }
}

export function clearCredentialSeal() {
  try {
    localStorage.removeItem(CRED_SEAL_KEY);
  } catch {
    /* ignore */
  }
}

export function clearEmployeeAuthStorage() {
  try {
    localStorage.removeItem(CRED_SEAL_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** If API network changed (testnet -> mainnet) or session secret rotated, drop stale seals. */
export async function syncAuthNetwork(): Promise<void> {
  try {
    const res = await fetch("/api/health", { credentials: "include" });
    if (!res.ok) return;
    const health = (await res.json()) as { network?: string };
    const net = health.network || "";
    const prev = localStorage.getItem(NETWORK_KEY);
    if (prev && net && prev !== net) {
      clearEmployeeAuthStorage();
    }
    if (net) localStorage.setItem(NETWORK_KEY, net);
  } catch {
    /* ignore */
  }
}

function isStaleSealError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || "");
  return /invalid sealed token/i.test(msg) || /sealed token signature/i.test(msg);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Passkey API error ${res.status}`);
  }
  return data as T;
}

export type PasskeySession = {
  employeeId: string;
  name?: string;
  walletAddress?: string;
  sessionToken: string;
  credentialSeal?: string;
  authMethod: string;
  registered?: boolean;
};

async function registerPasskey(employeeId?: string): Promise<PasskeySession> {
  const opt = await postJson<{
    options: any;
    challengeToken: string;
    employeeId: string;
  }>("/api/employee/passkey/register/options", { employeeId });

  const attestation = await startRegistration({ optionsJSON: opt.options });
  const verified = await postJson<PasskeySession>("/api/employee/passkey/register/verify", {
    challengeToken: opt.challengeToken,
    attestation,
    employeeId: opt.employeeId,
  });
  if (verified.credentialSeal) saveCredentialSeal(verified.credentialSeal);
  return { ...verified, registered: true };
}

async function authenticatePasskey(employeeId: string | undefined, existing: string): Promise<PasskeySession> {
  const opt = await postJson<{
    options: any;
    challengeToken: string;
    employeeId: string;
  }>("/api/employee/passkey/login/options", {
    employeeId,
    credentialSeal: existing,
  });

  const assertion = await startAuthentication({ optionsJSON: opt.options });
  const verified = await postJson<PasskeySession>("/api/employee/passkey/login/verify", {
    challengeToken: opt.challengeToken,
    assertion,
    credentialSeal: existing,
  });
  if (verified.credentialSeal) saveCredentialSeal(verified.credentialSeal);
  return verified;
}

/**
 * Register a new platform passkey (first visit) or authenticate with existing one.
 * Auto-recovers if session secret rotated (mainnet cutover) by re-registering.
 */
export async function loginWithPasskey(employeeId?: string): Promise<PasskeySession> {
  if (!passkeySupported()) {
    throw new Error(
      "Passkeys are not supported in this browser. Use Chrome/Safari/Edge on HTTPS (or localhost)."
    );
  }

  await syncAuthNetwork();

  const existing = loadCredentialSeal();
  if (!existing) {
    return registerPasskey(employeeId);
  }

  try {
    return await authenticatePasskey(employeeId, existing);
  } catch (err) {
    if (isStaleSealError(err)) {
      // Session secret rotated or network switched — clear and enroll fresh passkey seal
      clearEmployeeAuthStorage();
      return registerPasskey(employeeId);
    }
    // WebAuthn cancel / unknown credential: offer re-register once
    const msg = err instanceof Error ? err.message : String(err);
    if (/not allowed|abort|credential|unknown|invalid/i.test(msg)) {
      clearCredentialSeal();
      return registerPasskey(employeeId);
    }
    throw err;
  }
}
