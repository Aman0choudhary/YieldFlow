import { useEffect, useState } from "react";
import { DEMO_EMPLOYEE_ADDRESS, sdk } from "../sdk/yieldflow-sdk";
import type { EmployeeBalance as EmployeeBalanceType } from "../sdk/types";
import { SectionHeader } from "./SectionHeader";

function AnimatedDigit({ char }: { char: string }) {
  const [current, setCurrent] = useState(char);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (char !== current) {
      setChanging(true);
      const timer = setTimeout(() => {
        setCurrent(char);
        setChanging(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [char, current]);

  if (char === "." || char === "," || char === "$") {
    return <span className="live-counter-digit">{char}</span>;
  }

  return (
    <span className={`live-counter-digit ${changing ? "changing text-gradient" : ""}`}>
      {current}
    </span>
  );
}

export function EmployeeBalance({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [data, setData] = useState<EmployeeBalanceType | null>(null);
  const [employeeId, setEmployeeId] = useState<string>(DEMO_EMPLOYEE_ADDRESS);
  const [liveValue, setLiveValue] = useState(0);
  const [baseValue, setBaseValue] = useState(0);
  const [rate, setRate] = useState(0);
  const [tickStart, setTickStart] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; date: string; amount: string; dest: string; status: string }>
  >([]);

  const refresh = async (id: string) => {
    const res = await sdk.getEmployeeBalance(id);
    setData(res);
    setBaseValue(res.unlockedAmount);
    setRate(res.ratePerSecond);
    setLiveValue(res.unlockedAmount);
    setTickStart(Date.now());
    return res;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let id = (await sdk.restoreEmployeeSession()).employeeId;
        if (!id) {
          const session = await sdk.loginEmployee();
          id = session.employeeId;
        }
        if (cancelled) return;
        setEmployeeId(id);
        await refresh(id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load employee balance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - tickStart) / 1000;
      setLiveValue(baseValue + elapsedSeconds * rate);
    }, 250);
    return () => clearInterval(interval);
  }, [data, baseValue, rate, tickStart]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setStatus(null);
    setError(null);
    try {
      const result = await sdk.withdraw(employeeId);
      if (result.status === "failed") {
        setError("Withdrawal failed on-chain.");
      } else {
        setStatus(`Withdrew $${result.amountReceived.toFixed(4)} · ${result.txId.slice(0, 14)}…`);
        setHistory((prev) => [
          {
            id: result.txId.slice(0, 10),
            date: new Date().toISOString().replace("T", " ").slice(0, 16),
            amount: `$${result.amountReceived.toFixed(4)}`,
            dest: "Stellar Wallet (testnet USDC)",
            status: result.status === "success" ? "Settled" : "Pending",
          },
          ...prev,
        ].slice(0, 8));
        await refresh(employeeId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to withdraw");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <h2 className="text-gradient">Authenticating Passkey...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <h2>Employee session failed</h2>
        <p style={{ color: "var(--pink)", marginTop: "var(--spacer-12)" }}>{error}</p>
        <button className="btn" style={{ marginTop: "var(--spacer-16)" }} onClick={() => onNavigate?.("login")}>
          Back to Login
        </button>
      </div>
    );
  }

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  }).format(liveValue);

  const short = `${employeeId.slice(0, 6)}…${employeeId.slice(-4)}`;

  return (
    <>
      {onNavigate && (
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
            ← Back to Home Landing
          </button>
          <span className="label" style={{ color: "var(--grey-300)" }}>
            Session {short}
          </span>
          <button
            className="btn btn-outline"
            style={{ fontSize: "12px" }}
            onClick={() => {
              sdk.logoutEmployee();
              onNavigate("login");
            }}
          >
            Sign out
          </button>
        </div>
      )}

      <section className="section-block" style={{ paddingTop: "var(--spacer-16)" }}>
        <SectionHeader
          index="01"
          eyebrow="LIVE EARNINGS STREAM"
          thesis="Your wages unlocking second-by-second."
          paragraph="Live unlocked balance from the Streaming contract on Stellar testnet."
        />

        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div
            className="df-cell full-width slide-up"
            style={{ textAlign: "center", padding: "var(--spacer-48) var(--spacer-24)" }}
          >
            <span
              className="label"
              style={{ color: "var(--theme-accent)", display: "block", marginBottom: "var(--spacer-16)" }}
            >
              AVAILABLE LIQUID BALANCE
            </span>
            <h1 className="display" style={{ fontSize: "clamp(44px, 9vw, 150px)" }}>
              {formattedValue.split("").map((char, i) => (
                <AnimatedDigit key={`${i}-${char}`} char={char} />
              ))}
            </h1>
            <p className="large" style={{ marginTop: "var(--spacer-24)", color: "var(--grey-300)" }}>
              Stream Rate:{" "}
              <span style={{ color: "var(--theme-fg)", fontWeight: 600 }}>
                ${(rate * 3600).toFixed(4)}/hr
              </span>
              {data.nextPayday ? ` · Next: ${data.nextPayday}` : ""}
            </p>

            <div style={{ marginTop: "var(--spacer-32)" }}>
              <button
                className="btn"
                style={{ fontSize: "16px", padding: "var(--spacer-16) var(--spacer-32)" }}
                onClick={() => void handleWithdraw()}
                disabled={withdrawing}
              >
                {withdrawing ? "Withdrawing…" : "Withdraw Instantly (Zero Fee)"}
              </button>
            </div>
            {status && (
              <p className="label" style={{ marginTop: "var(--spacer-16)", color: "var(--theme-accent)" }}>
                {status}
              </p>
            )}
            {error && (
              <p className="label" style={{ marginTop: "var(--spacer-16)", color: "var(--pink)" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="SETTLEMENTS"
          thesis="Withdrawals from this session."
          paragraph="Live withdraws appear here after you request payout."
        />
        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: "0.2s", padding: 0 }}>
            <table className="table-df">
              <thead>
                <tr>
                  <th>Withdrawal ID</th>
                  <th>Date & Time</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--grey-300)" }}>
                      No withdrawals in this session yet.
                    </td>
                  </tr>
                )}
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: "var(--grey-300)" }}>{item.id}</td>
                    <td style={{ color: "var(--grey-300)" }}>{item.date}</td>
                    <td>{item.dest}</td>
                    <td style={{ fontWeight: 600, color: "var(--theme-accent)" }}>{item.amount}</td>
                    <td>
                      <span className="label" style={{ color: "var(--theme-accent)" }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader
          index="03"
          eyebrow="SECURITY"
          thesis="Demo passkey session bound to testnet employee."
          paragraph="MVP uses a server-mediated demo session for the fixed testnet employee account. Real multi-user Passkey Kit is next."
        />
        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell grid-2-cell slide-up">
            <span className="label" style={{ color: "var(--theme-accent)" }}>
              SESSION WALLET
            </span>
            <h3 style={{ marginTop: "var(--spacer-12)", fontFamily: "NON Natural Mono", fontSize: "16px" }}>
              {employeeId}
            </h3>
          </div>
          <div className="df-cell grid-2-cell slide-up">
            <span className="label" style={{ color: "var(--grey-300)" }}>
              STREAM CAP
            </span>
            <h3 style={{ marginTop: "var(--spacer-12)" }}>
              ${(data.streamCap ?? 0).toFixed(4)} · streamed ${(data.totalStreamed ?? 0).toFixed(4)}
            </h3>
          </div>
        </div>
      </section>
    </>
  );
}