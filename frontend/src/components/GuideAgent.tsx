import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const STARTERS = [
  "How does YieldFlow payroll work?",
  "What is the buffer vs Blend yield?",
  "How do employees withdraw?",
  "What is a passkey here?",
  "Is this mainnet?",
];

function answer(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("mainnet") || q.includes("real money") || q.includes("production network")) {
    return "Right now the live app is on Stellar **testnet**. Mainnet prep is documented, but mainnet is not switched on until you explicitly deploy. Test USDC is not real cash.";
  }
  if (q.includes("passkey") || q.includes("login") || q.includes("face") || q.includes("touch")) {
    return "Employees sign in with a **real device passkey** (Face ID / Touch ID / Windows Hello). First visit registers a passkey; later visits authenticate. Withdrawals require that session — random API calls without login are blocked.";
  }
  if (q.includes("withdraw") || q.includes("payout") || q.includes("cash out")) {
    return "As time passes, the streaming contract **unlocks** salary second-by-second. Employees open the Employee portal, passkey-login, then Withdraw. Funds come from the vault **buffer** (and can rebalance from Blend if needed). Only unlocked amount can leave.";
  }
  if (q.includes("buffer") || q.includes("blend") || q.includes("yield") || q.includes("apy") || q.includes("defindex")) {
    return "Employer deposits USDC into the YieldFlow vault. About **15% stays liquid (buffer)** for near-term employee withdrawals. About **85% is supplied to Blend** to earn yield. DeFindex is integrated as the **strategy-layer reference** (DeFindex → Blend style architecture). Headline APY is estimated from live Blend reserve data.";
  }
  if (q.includes("employer") || q.includes("deposit") || q.includes("fund") || q.includes("treasury")) {
    return "Employers use the **Treasury Vault** dashboard: see pool, buffer, yield split, and fund the vault. Funding is a real on-chain deposit (testnet USDC). Approvals authorize employee streams. Admin console can also deposit with the operator admin key.";
  }
  if (q.includes("employee") || q.includes("salary") || q.includes("stream") || q.includes("wage")) {
    return "Each employee has a **stream**: total amount over a time window (e.g. $50 over 30 days on the demo). Balance unlocks continuously. The UI counter resyncs from chain so it stays continuous when you leave and return.";
  }
  if (q.includes("admin") || q.includes("operator") || q.includes("key")) {
    return "There is an **Admin console** in the menu (06). Unlock with the server admin API key (YIELDFLOW_ADMIN_API_KEY). That key is for operators only — deposit/stream via API header. Normal users never need it. Employee withdraw uses passkey session, not the admin key.";
  }
  if (q.includes("secure") || q.includes("safe") || q.includes("hack") || q.includes("risk")) {
    return "Hardened for testnet demo: passkey sessions required for withdraw, CSRF on browser money actions, CORS locked, rate limits. Still not bank-grade: server hot signer exists, no formal audit, and this is testnet. Don’t put large real funds until mainnet custody is redesigned.";
  }
  if (q.includes("how") || q.includes("work") || q.includes("payroll") || q.includes("explain") || q.includes("what is")) {
    return "YieldFlow is **streaming payroll on Stellar**:\n1) Employer deposits USDC once.\n2) Vault keeps a liquid buffer and puts the rest into Blend yield.\n3) Employee salary unlocks every second on-chain.\n4) Employee passkey-authenticates and withdraws unlocked USDC.\nThat removes “idle payroll sitting in a bank until month-end” while keeping instant access for workers.";
  }
  return "I can explain YieldFlow mechanics: employer vault, buffer vs Blend yield, employee streaming, passkeys, withdraws, admin vs user roles, and testnet vs mainnet. Try: “How does payroll work?” or “What is the buffer?”";
}

export function GuideAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I’m the YieldFlow guide. Ask how streaming payroll, Blend yield, passkeys, or withdraws work.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "assistant", text: answer(q) }]);
    setInput("");
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
          zIndex: 600,
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
            <div style={{ fontSize: "13px", color: "var(--grey-300)" }}>AI product assistant</div>
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
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask how payroll works…"
              style={{
                flex: 1,
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--grey-100)",
                color: "var(--theme-fg)",
                fontSize: "13px",
              }}
            />
            <button className="btn" type="submit" style={{ fontSize: "12px" }}>
              Send
            </button>
          </form>
        </div>
      </div>
    ),
    [msgs, input]
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
          zIndex: 610,
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
