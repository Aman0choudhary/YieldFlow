import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const STARTERS = [
  "How does YieldFlow payroll work?",
  "What is the buffer vs Blend yield?",
  "How do employees withdraw?",
  "What is a passkey here?",
  "Is this mainnet?",
];

function localAnswer(question: string): string {
  const q = question.toLowerCase();
  if (/(api[_-]?key|secret|private key|admin key|signer|mnemonic|seed)/i.test(q) && /(show|reveal|give|what is|tell|dump|leak)/i.test(q)) {
    return "I can’t share secrets, API keys, admin keys, or private keys. I only explain how YieldFlow works for users.";
  }
  if (q.includes("mainnet") || q.includes("real money")) {
    return "The public app is on Stellar testnet unless operators switch networks. Test USDC is not real cash.";
  }
  if (q.includes("passkey") || q.includes("login")) {
    return "Employees use a real device passkey (Face ID / Touch ID / Windows Hello). Withdrawals need that session.";
  }
  if (q.includes("withdraw")) {
    return "Salary unlocks over time on-chain. Employees passkey-login and withdraw only the unlocked amount from the vault buffer.";
  }
  if (q.includes("buffer") || q.includes("blend") || q.includes("yield") || q.includes("defindex")) {
    return "Employer deposits USDC: ~15% stays liquid (buffer), ~85% goes to Blend for yield. DeFindex is the strategy-layer reference (DeFindex → Blend architecture).";
  }
  if (q.includes("employer") || q.includes("fund") || q.includes("deposit")) {
    return "Employers use the Treasury Vault to fund payroll and watch buffer/yield. Approvals authorize employee streams.";
  }
  if (q.includes("admin")) {
    return "Admin console is for operators only (menu 06). Normal users use Employer/Employee portals. Admin key is never shown by this guide.";
  }
  if (q.includes("how") || q.includes("work") || q.includes("payroll") || q.includes("what is")) {
    return "YieldFlow streams payroll on Stellar: employer deposits once → buffer + Blend yield → employee balance unlocks every second → passkey withdraw of unlocked USDC.";
  }
  return "Ask about payroll flow, buffer vs yield, passkeys, withdraws, employer vs employee roles, or testnet vs mainnet.";
}

async function askServer(message: string, history: Msg[]): Promise<{ reply: string; source?: string }> {
  const res = await fetch("/api/guide", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.slice(-8).map((m) => ({
        role: m.role,
        content: m.text,
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Guide error ${res.status}`);
  }
  return {
    reply: String((data as { reply?: string }).reply || localAnswer(message)),
    source: (data as { source?: string }).source,
  };
}

export function GuideAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I’m the YieldFlow guide. Ask how streaming payroll, Blend yield, passkeys, or withdraws work. I never share secrets or admin keys.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  // Warm CSRF cookie for /api/guide
  useEffect(() => {
    void fetch("/api/health", { credentials: "include" }).catch(() => undefined);
  }, []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    try {
      const history = [...msgs, { role: "user" as const, text: q }];
      const { reply } = await askServer(q, history);
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: localAnswer(q) }]);
    } finally {
      setBusy(false);
    }
  };

  const panel = useMemo(
    () => (
      <div
        style={{
          position: "fixed",
          right: "20px",
          bottom: "88px",
          width: "min(380px, calc(100vw - 32px))",
          height: "min(520px, calc(100vh - 120px))",
          zIndex: 520,
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--grey-100)",
          background: "rgba(7,9,11,0.94)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--grey-100)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div>
            <div className="label" style={{ color: "var(--theme-accent)" }}>
              YIELDFLOW GUIDE
            </div>
            <div style={{ fontSize: "13px", color: "var(--grey-300)" }}>
              AI assistant · secrets never shared
            </div>
          </div>
          <button className="btn btn-outline" style={{ fontSize: "11px", padding: "6px 10px" }} onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "92%",
                padding: "10px 12px",
                border: "1px solid var(--grey-100)",
                background: m.role === "user" ? "rgba(45,212,168,0.08)" : "rgba(255,255,255,0.02)",
                color: "var(--theme-fg)",
                fontSize: "13px",
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          ))}
          {busy && (
            <div className="label" style={{ color: "var(--grey-300)" }}>
              Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--grey-100)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-outline"
                style={{ fontSize: "10px", padding: "6px 8px" }}
                disabled={busy}
                onClick={() => void send(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how payroll works…"
              disabled={busy}
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--grey-100)",
                color: "var(--theme-fg)",
                fontSize: "13px",
              }}
            />
            <button className="btn" type="submit" style={{ fontSize: "12px" }} disabled={busy}>
              Send
            </button>
          </form>
        </div>
      </div>
    ),
    [msgs, input, busy]
  );

  return (
    <>
      {open && panel}
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 530,
          borderRadius: "999px",
          padding: "14px 18px",
          fontSize: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
        aria-label="Open YieldFlow guide"
      >
        {open ? "Close guide" : "Ask AI guide"}
      </button>
    </>
  );
}
