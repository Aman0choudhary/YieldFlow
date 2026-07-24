import { useMemo, useState } from "react";
import { SectionHeader } from "./SectionHeader";

const ADMIN_KEY_STORAGE = "yieldflow.adminApiKey";

async function adminFetch<T>(path: string, adminKey: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-yieldflow-admin-key": adminKey,
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `API ${res.status}`);
  return body as T;
}

export function AdminPanel({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
    } catch {
      return "";
    }
  });
  const [unlocked, setUnlocked] = useState(() => Boolean(adminKey));
  const [amount, setAmount] = useState("10");
  const [streamAmount, setStreamAmount] = useState("50");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  const masked = useMemo(() => {
    if (!adminKey) return "—";
    if (adminKey.length <= 4) return "••••";
    return `${adminKey.slice(0, 2)}••••${adminKey.slice(-2)}`;
  }, [adminKey]);

  const unlock = () => {
    setError(null);
    if (!adminKey.trim()) {
      setError("Enter the admin API key first.");
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
    } catch {
      /* ignore */
    }
    setUnlocked(true);
    setStatus("Admin key stored for this browser session only (sessionStorage).");
  };

  const lock = () => {
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch {
      /* ignore */
    }
    setAdminKey("");
    setUnlocked(false);
    setStatus("Admin session cleared.");
  };

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const result = await fn();
      setStatus(`${label} OK · ${JSON.stringify(result).slice(0, 180)}…`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 var(--spacer-24)",
          marginTop: "var(--spacer-16)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("login")}>
          ← Back to Home
        </button>
        <span className="label" style={{ color: "var(--grey-300)" }}>
          Admin console · key {unlocked ? masked : "locked"}
        </span>
        <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("employer")}>
          Employer vault →
        </button>
      </div>

      <section className="section-block" style={{ paddingTop: "var(--spacer-16)" }}>
        <SectionHeader
          index="00"
          eyebrow="ADMIN CONSOLE"
          thesis="Privileged payroll controls for the operator."
          paragraph="This is not a public page. Unlock with YIELDFLOW_ADMIN_API_KEY, then deposit, authorize streams, or inspect API health. Key stays in sessionStorage only."
        />

        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell grid-2-cell slide-up">
            <span className="label" style={{ color: "var(--theme-accent)" }}>
              UNLOCK
            </span>
            {!unlocked ? (
              <>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Admin API key"
                  style={{
                    marginTop: "var(--spacer-16)",
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--grey-100)",
                    color: "var(--theme-fg)",
                    fontFamily: "NON Natural Mono, monospace",
                  }}
                />
                <button className="btn" style={{ marginTop: "var(--spacer-16)" }} onClick={unlock} disabled={busy}>
                  Unlock admin
                </button>
              </>
            ) : (
              <div style={{ marginTop: "var(--spacer-16)" }}>
                <p className="label" style={{ color: "var(--theme-accent)" }}>
                  Session unlocked · {masked}
                </p>
                <button className="btn btn-outline" style={{ marginTop: "12px" }} onClick={lock}>
                  Lock / clear key
                </button>
              </div>
            )}
          </div>

          <div className="df-cell grid-2-cell slide-up">
            <span className="label" style={{ color: "var(--grey-300)" }}>
              HOW TO USE
            </span>
            <ul style={{ marginTop: "var(--spacer-16)", color: "var(--grey-300)", lineHeight: 1.6, paddingLeft: "18px" }}>
              <li>Menu → 06 ADMIN CONSOLE (this page)</li>
              <li>Or open site and navigate here after unlock</li>
              <li>CLI: header X-YieldFlow-Admin-Key</li>
              <li>Browser Fund Vault still uses CSRF (no admin key needed)</li>
            </ul>
          </div>
        </div>
      </section>

      {unlocked && (
        <section className="section-block">
          <SectionHeader
            index="01"
            eyebrow="OPERATOR ACTIONS"
            thesis="Deposit, stream, health."
            paragraph="These calls send X-YieldFlow-Admin-Key and bypass browser CSRF requirements."
          />
          <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
            <div className="df-cell grid-3-cell slide-up">
              <span className="label">Deposit USDC</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--grey-100)",
                  color: "var(--theme-fg)",
                }}
              />
              <button
                className="btn"
                style={{ marginTop: "12px" }}
                disabled={busy}
                onClick={() =>
                  void run("Deposit", () =>
                    adminFetch("/api/deposit", adminKey, {
                      method: "POST",
                      body: JSON.stringify({ amount }),
                    })
                  )
                }
              >
                Deposit
              </button>
            </div>
            <div className="df-cell grid-3-cell slide-up">
              <span className="label">Create stream (USDC / 30d)</span>
              <input
                value={streamAmount}
                onChange={(e) => setStreamAmount(e.target.value)}
                style={{
                  marginTop: "12px",
                  width: "100%",
                  padding: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--grey-100)",
                  color: "var(--theme-fg)",
                }}
              />
              <button
                className="btn"
                style={{ marginTop: "12px" }}
                disabled={busy}
                onClick={() =>
                  void run("Stream", () =>
                    adminFetch("/api/stream/create", adminKey, {
                      method: "POST",
                      body: JSON.stringify({ totalAmount: streamAmount, durationDays: 30 }),
                    })
                  )
                }
              >
                Create / ensure stream
              </button>
            </div>
            <div className="df-cell grid-3-cell slide-up">
              <span className="label">Health</span>
              <button
                className="btn btn-outline"
                style={{ marginTop: "12px" }}
                disabled={busy}
                onClick={() =>
                  void run("Health", async () => {
                    const h = await adminFetch<Record<string, unknown>>("/api/health", adminKey);
                    setHealth(h);
                    return h;
                  })
                }
              >
                Refresh health
              </button>
              {health && (
                <pre
                  style={{
                    marginTop: "12px",
                    fontSize: "11px",
                    color: "var(--grey-300)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "NON Natural Mono, monospace",
                  }}
                >
                  {JSON.stringify(health, null, 2)}
                </pre>
              )}
            </div>
          </div>
          {status && (
            <p className="label" style={{ marginTop: "var(--spacer-16)", color: "var(--theme-accent)", padding: "0 var(--spacer-24)" }}>
              {status}
            </p>
          )}
          {error && (
            <p className="label" style={{ marginTop: "var(--spacer-12)", color: "var(--pink)", padding: "0 var(--spacer-24)" }}>
              {error}
            </p>
          )}
        </section>
      )}
    </>
  );
}
