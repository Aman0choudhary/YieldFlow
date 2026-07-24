import { useEffect, useState } from "react";
import { sdk } from "../sdk/yieldflow-sdk";
import type { ActivityItem, EmployerStats } from "../sdk/types";
import { SectionHeader } from "./SectionHeader";

export function EmployerDashboard({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [employerAddress, setEmployerAddress] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [connection, nextStats, nextActivity] = await Promise.all([
        sdk.connectEmployer(),
        sdk.getEmployerStats(),
        sdk.getActivity(),
      ]);
      setEmployerAddress(connection.address);
      setStats(nextStats);
      setActivity(nextActivity);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vault data");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const fundVault = async () => {
    setFunding(true);
    setStatus(null);
    setError(null);
    try {
      const tx = await sdk.depositPayroll(1);
      setStatus(
        tx.status === "failed"
          ? `Deposit failed (${tx.txId})`
          : `Deposit submitted: ${tx.txId.slice(0, 16)}…`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setFunding(false);
    }
  };

  if (!stats && !error) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <h2 className="text-gradient">Loading Treasury Vault...</h2>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: "60vh", justifyContent: "center" }}>
        <h2>Unable to load vault</h2>
        <p style={{ color: "var(--pink)", marginTop: "var(--spacer-12)" }}>{error}</p>
        <button className="btn" style={{ marginTop: "var(--spacer-16)" }} onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const money = (n: number, digits = 2) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);

  const total = money(stats.totalPool);
  const yieldEarned = money(stats.yieldEarned, 4);
  const bufferPercent =
    stats.totalPool > 0
      ? (stats.bufferStatus.available / stats.totalPool) * 100
      : stats.bufferPercent ?? 15;
  const yieldPercent =
    stats.totalPool > 0
      ? (stats.bufferStatus.earningYield / stats.totalPool) * 100
      : stats.yieldRoutePercent ?? 85;

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 var(--spacer-24)",
          marginTop: "var(--spacer-16)",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("login")}>
          ← Back to Home Landing
        </button>
        <div className="label" style={{ color: "var(--grey-300)" }}>
          Employer {employerAddress ? `${employerAddress.slice(0, 6)}…${employerAddress.slice(-4)}` : "—"}
        </div>
        <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("approvals")}>
          Manage Stream Approvals →
        </button>
      </div>

      <section className="section-block" style={{ paddingTop: "var(--spacer-16)" }}>
        <SectionHeader
          index="01"
          eyebrow="TREASURY VAULT"
          thesis="Corporate payroll capital actively generating yield."
          paragraph="Live vault stats from the YieldFlow Soroban contracts on Stellar testnet."
        />

        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: "0.2s" }}>
            <span className="label" style={{ color: "var(--grey-300)" }}>
              Total Vault Assets
            </span>
            <h1 className="display" style={{ fontSize: "clamp(48px, 7vw, 96px)", marginTop: "var(--spacer-12)" }}>
              {total}
            </h1>
            <p className="large text-gradient" style={{ marginTop: "var(--spacer-12)" }}>
              + {yieldEarned} Yield Harvested
            </p>
          </div>

          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: "0.3s" }}>
            <span className="label" style={{ color: "var(--grey-300)" }}>
              Liquidity Allocation
            </span>
            <h3 style={{ marginTop: "var(--spacer-16)" }}>Yield vs. Instant Buffer</h3>

            <div
              style={{
                display: "flex",
                height: "16px",
                width: "100%",
                marginTop: "var(--spacer-24)",
                gap: "2px",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div style={{ width: `${Math.max(0, Math.min(100, yieldPercent))}%`, backgroundColor: "var(--theme-accent)", transition: "width 1s" }} />
              <div style={{ width: `${Math.max(0, Math.min(100, bufferPercent))}%`, backgroundColor: "var(--grey-300)", transition: "width 1s" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--spacer-16)" }}>
              <div>
                <div className="label text-gradient">
                  Yield allocation ({stats.yieldRoutePercent ?? Math.round(yieldPercent)}%)
                </div>
                <div style={{ fontFamily: "FK Roman Standard", fontSize: "24px", marginTop: "4px" }}>
                  {money(stats.bufferStatus.earningYield)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label" style={{ color: "var(--grey-300)" }}>
                  Buffer ({stats.bufferPercent ?? Math.round(bufferPercent)}%)
                </div>
                <div
                  style={{
                    fontFamily: "FK Roman Standard",
                    fontSize: "24px",
                    color: "var(--grey-300)",
                    marginTop: "4px",
                  }}
                >
                  {money(stats.bufferStatus.available)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--spacer-12)", marginTop: "var(--spacer-32)", flexWrap: "wrap" }}>
              <button className="btn" onClick={() => void fundVault()} disabled={funding}>
                {funding ? "Funding…" : "Fund Vault ($1)"}
              </button>
              <button className="btn btn-outline" onClick={() => onNavigate("approvals")}>
                Manage Streams
              </button>
              <button className="btn btn-outline" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            {status && (
              <p className="label" style={{ marginTop: "var(--spacer-12)", color: "var(--theme-accent)" }}>
                {status}
              </p>
            )}
            {error && (
              <p className="label" style={{ marginTop: "var(--spacer-12)", color: "var(--pink)" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="LEDGER"
          thesis="Live activity from the YieldFlow API."
          paragraph="Events returned by the production bridge (smoke + recent demo actions)."
        />

        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: "0.2s", padding: 0 }}>
            <table className="table-df">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Label</th>
                  <th>Amount</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: "var(--grey-300)" }}>
                      No activity yet.
                    </td>
                  </tr>
                )}
                {activity.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: "var(--grey-300)" }}>{tx.id}</td>
                    <td style={{ fontWeight: 600 }}>{tx.kind}</td>
                    <td style={{ color: "var(--grey-300)" }}>{tx.label}</td>
                    <td style={{ color: "var(--theme-accent)" }}>{tx.amount}</td>
                    <td style={{ color: "var(--grey-300)" }}>{tx.timestamp}</td>
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
          eyebrow="STREAM METRICS"
          thesis="Demo stream coverage."
          paragraph="MVP uses a single live testnet employee stream for end-to-end verification."
        />
        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: "0.2s" }}>
            <span className="label" style={{ color: "var(--grey-300)" }}>
              Active Headcount
            </span>
            <h2 style={{ marginTop: "var(--spacer-12)" }}>{stats.activeEmployees ?? 1} Worker</h2>
          </div>
          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: "0.3s" }}>
            <span className="label" style={{ color: "var(--grey-300)" }}>
              Projected APY
            </span>
            <h2 style={{ marginTop: "var(--spacer-12)" }}>{stats.projectedApy ?? "0.0"}%</h2>
          </div>
          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: "0.4s" }}>
            <span className="label" style={{ color: "var(--grey-300)" }}>
              Buffer Efficiency
            </span>
            <h2 className="text-gradient" style={{ marginTop: "var(--spacer-12)" }}>
              {Math.round(bufferPercent)}% liquid
            </h2>
          </div>
        </div>
      </section>
    </>
  );
}