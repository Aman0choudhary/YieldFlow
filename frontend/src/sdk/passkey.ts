/**
 * Browser WebAuthn (Passkey) client for YieldFlow employee auth.
 */
import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const CRED_SEAL_KEY = "yieldflow.passkey.credentialSeal";

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

/**
 * Register a new platform passkey (first visit) or authenticate with existing one.
 */
export async function loginWithPasskey(employeeId?: string): Promise<PasskeySession> {
  if (!passkeySupported()) {
    throw new Error(
      "Passkeys are not supported in this browser. Use Chrome/Safari/Edge on HTTPS (or localhost)."
    );
  }

  const existing = loadCredentialSeal();
  if (!existing) {
    // First-time enrollment
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
    return verified;
  }

  // Returning user
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
