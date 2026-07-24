import { useEffect, useState } from "react";
import { sdk } from "../sdk/yieldflow-sdk";
import type { ActivityItem, EmployerStats } from "../sdk/types";
import { SectionHeader } from "./SectionHeader";
import { friendlyError } from "../sdk/local-persist";

export function EmployerDashboard({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [employerAddress, setEmployerAddress] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [fundAmount, setFundAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [activeChartPoint, setActiveChartPoint] = useState<{ day: string; apy: number; yieldVal: string } | null>(null);

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
      setError(friendlyError(e));
    }
  };

  useEffect(() => {
    void load();
    const poll = setInterval(() => {
      void load();
    }, 12000);
    return () => clearInterval(poll);
  }, []);

  const fundVault = async () => {
    setFunding(true);
    setStatus(null);
    setError(null);
    try {
      const tx = await sdk.depositPayroll(fundAmount);
      setStatus(
        tx.status === "failed"
          ? `Deposit failed (${tx.txId})`
          : `Deposit confirmed Â· 15% buffer / 85% Blend Â· ${tx.txId.slice(0, 12)}â€¦`
      );
      await load();
    } catch (e) {
      setError(friendlyError(e));
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

  // Chart shape is illustrative; Sunday uses live projected APY from Blend.
  const liveApy = parseFloat(stats.projectedApy || "0") || 0;
  const chartData = [
    { day: "Mon", apy: +(liveApy * 0.9).toFixed(2), yieldVal: money(stats.yieldEarned * 0.2, 4) },
    { day: "Tue", apy: +(liveApy * 0.93).toFixed(2), yieldVal: money(stats.yieldEarned * 0.35, 4) },
    { day: "Wed", apy: +(liveApy * 0.97).toFixed(2), yieldVal: money(stats.yieldEarned * 0.5, 4) },
    { day: "Thu", apy: +(liveApy * 0.95).toFixed(2), yieldVal: money(stats.yieldEarned * 0.65, 4) },
    { day: "Fri", apy: +(liveApy * 1.02).toFixed(2), yieldVal: money(stats.yieldEarned * 0.8, 4) },
    { day: "Sat", apy: +(liveApy * 1.05).toFixed(2), yieldVal: money(stats.yieldEarned * 0.92, 4) },
    { day: "Sun", apy: liveApy, yieldVal: yieldEarned },
  ];

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
          â† Back to Home Landing
        </button>
        <div className="label" style={{ color: "var(--grey-300)" }}>
          Employer {employerAddress ? `${employerAddress.slice(0, 6)}â€¦${employerAddress.slice(-4)}` : "â€”"}
          {" Â· "}
          <span style={{ color: "var(--theme-accent)" }}>Blend + DeFindex strategy stack</span>
        </div>
        <button className="btn btn-outline" style={{ fontSize: "12px" }} onClick={() => onNavigate("approvals")}>
          Manage Stream Approvals â†’
        </button>
      </div>

      <section className="section-block" style={{ paddingTop: "var(--spacer-16)" }}>
        <SectionHeader
          index="01"
          eyebrow="TREASURY VAULT"
          thesis="Corporate payroll capital actively generating yield."
          paragraph="Live vault stats: buffer stays liquid, yield leg earns on Blend. DeFindex USDC vault is the strategy-layer reference (DeFindex → Blend)." 
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

            {/* Split Bar */}
            <div
              style={{
                position: "relative",
                display: "flex",
                height: "20px",
                width: "100%",
                marginTop: "var(--spacer-24)",
                gap: "3px",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid var(--grey-100)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <div
                title={`Yield Route: ${Math.round(yieldPercent)}%`}
                style={{
                  width: `${Math.max(0, Math.min(100, yieldPercent))}%`,
                  background: "linear-gradient(90deg, #10b981, #2dd4a8)",
                  transition: "width 1s cubic-bezier(0.2, 1, 0.3, 1)",
                  boxShadow: "0 0 12px rgba(45, 212, 168, 0.4)",
                }}
              />
              <div
                title={`Instant Buffer: ${Math.round(bufferPercent)}%`}
                style={{
                  width: `${Math.max(0, Math.min(100, bufferPercent))}%`,
                  background: "linear-gradient(90deg, #ff5500, #ffb173)",
                  transition: "width 1s cubic-bezier(0.2, 1, 0.3, 1)",
                }}
              />
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
                <div className="label" style={{ color: "var(--orange)" }}>
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
              {[10, 25, 50, 100].map((n) => (
                <button key={n} type="button" className="btn btn-outline" style={{ fontSize: "12px", borderColor: fundAmount === n ? "var(--theme-accent)" : undefined, color: fundAmount === n ? "var(--theme-accent)" : undefined }} onClick={() => setFundAmount(n)} disabled={funding}>{`${n}`}</button>
              ))}
              <button className="btn" onClick={() => void fundVault()} disabled={funding}>
                {funding ? "Funding…" : `Fund Vault ($${fundAmount})`}
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
            <p className="label" style={{ marginTop: "var(--spacer-12)", color: "var(--grey-300)" }}>
              Need USDC? Circle testnet faucet â†’ employer GD2Xâ€¦ (see docs/TESTNET_MVP_STATUS.md)
            </p>
          </div>
        </div>
      </section>

      
      <section className="section-block">
        <SectionHeader
          index="01B"
          eyebrow="DEFINDEX STRATEGY LAYER"
          thesis="DeFindex routes idle capital into Blend strategies."
          paragraph={
            stats.defindex?.enabled
              ? `Live DeFindex vault ${stats.defindex.name || ""} (${stats.defindex.symbol || "DFXV"}) with strategy "${stats.defindex.strategyName || "Blend"}". Payroll currently yields via direct Blend on Circle USDC; DeFindex is the composable strategy router for aligned assets.`
              : "DeFindex vault stats unavailable right now. Payroll yield still runs on direct Blend."
          }
        />
        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell grid-3-cell slide-up">
            <span className="label" style={{ color: "var(--grey-300)" }}>DeFindex TVL</span>
            <h2 style={{ marginTop: "var(--spacer-12)" }}>
              {stats.defindex?.enabled ? money(Number(stats.defindex.tvl || 0)) : "—"}
            </h2>
          </div>
          <div className="df-cell grid-3-cell slide-up">
            <span className="label" style={{ color: "var(--grey-300)" }}>Strategy</span>
            <h3 style={{ marginTop: "var(--spacer-12)" }}>
              {stats.defindex?.strategyName || "USDC Blend Strategy"}
            </h3>
            <p className="label" style={{ marginTop: "8px", color: "var(--theme-accent)" }}>
              {stats.yieldStack?.activeYieldEngine === "blend_direct" ? "Active payroll engine: Blend direct" : "Yield engine idle"}
            </p>
          </div>
          <div className="df-cell grid-3-cell slide-up">
            <span className="label" style={{ color: "var(--grey-300)" }}>Stack</span>
            <h3 style={{ marginTop: "var(--spacer-12)", fontFamily: "NON Natural Mono", fontSize: "14px" }}>
              {stats.defindex?.stack || "defindex → blend"}
            </h3>
            <p className="label" style={{ marginTop: "8px", color: "var(--grey-300)" }}>
              Idle {stats.defindex?.idle ? money(Number(stats.defindex.idle)) : "—"} · Invested{" "}
              {stats.defindex?.invested ? money(Number(stats.defindex.invested)) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* APY PERFORMANCE CHART SECTION */}
      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="YIELD PERFORMANCE"
          thesis="Real-time APY yield accumulation curve."
          paragraph="Headline APY is estimated from the live Blend reserve curve used by payroll yield. DeFindex exposes the same Blend strategy class as a vault layer. Chart shape is illustrative."
        />

        <div className="df-grid" style={{ marginTop: "var(--spacer-24)" }}>
          <div className="df-cell full-width slide-up" style={{ padding: "var(--spacer-32)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacer-24)", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span className="label" style={{ color: "var(--theme-accent)" }}>CURRENT STRATEGY APY</span>
                <h2 style={{ fontSize: "36px", marginTop: "4px" }}>{stats.projectedApy ?? "6.50"}% APY</h2>
              </div>
              {activeChartPoint && (
                <div style={{ textAlign: "right", border: "1px solid var(--theme-accent)", padding: "8px 16px", backgroundColor: "rgba(45, 212, 168, 0.05)" }}>
                  <span className="label" style={{ color: "var(--theme-accent)" }}>{activeChartPoint.day} Performance</span>
                  <div style={{ fontFamily: "NON Natural Mono", fontSize: "14px" }}>
                    {activeChartPoint.apy}% APY Â· {activeChartPoint.yieldVal}
                  </div>
                </div>
              )}
            </div>

            {/* SVG Interactive Line Chart */}
            <div style={{ position: "relative", width: "100%", height: "200px" }}>
              <svg width="100%" height="100%" viewBox="0 0 700 200" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4a8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#2dd4a8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#2dd4a8" />
                    <stop offset="100%" stopColor="#ffb173" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                {/* Area fill under curve */}
                <path
                  d="M 0,160 L 100,140 L 200,100 L 300,120 L 400,70 L 500,50 L 600,40 L 700,20 L 700,180 L 0,180 Z"
                  fill="url(#chartGradient)"
                />

                {/* Smooth stroke line */}
                <path
                  d="M 0,160 Q 50,150 100,140 T 200,100 T 300,120 T 400,70 T 500,50 T 600,40 T 700,20"
                  fill="none"
                  stroke="url(#lineStroke)"
                  strokeWidth="3"
                />

                {/* Data points */}
                {[
                  { x: 0, y: 160, idx: 0 },
                  { x: 100, y: 140, idx: 1 },
                  { x: 200, y: 100, idx: 2 },
                  { x: 300, y: 120, idx: 3 },
                  { x: 400, y: 70, idx: 4 },
                  { x: 500, y: 50, idx: 5 },
                  { x: 700, y: 20, idx: 6 },
                ].map((pt) => (
                  <circle
                    key={pt.idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    fill="#07090b"
                    stroke="var(--theme-accent)"
                    strokeWidth="2"
                    style={{ cursor: "pointer", transition: "transform 0.2s, r 0.2s" }}
                    onMouseEnter={() => setActiveChartPoint(chartData[pt.idx])}
                  />
                ))}
              </svg>
            </div>

            {/* Chart X-Axis Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--spacer-16)", fontFamily: "NON Natural Mono", fontSize: "11px", color: "var(--grey-300)" }}>
              {chartData.map((d) => (
                <span key={d.day} style={{ cursor: "pointer" }} onMouseEnter={() => setActiveChartPoint(d)}>
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block">
        <SectionHeader
          index="03"
          eyebrow="LEDGER"
          thesis="Live activity from the YieldFlow API."
          paragraph="Recent actions from this browser and the live API. History persists across refresh in this browser."
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
                    <td style={{ color: "var(--grey-300)", fontFamily: "NON Natural Mono" }}>{tx.id}</td>
                    <td style={{ fontWeight: 600 }}>{tx.kind}</td>
                    <td style={{ color: "var(--grey-300)" }}>{tx.label}</td>
                    <td style={{ color: "var(--theme-accent)", fontWeight: 600 }}>{tx.amount}</td>
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
          index="04"
          eyebrow="STREAM METRICS"
          thesis="Demo stream coverage."
          paragraph="Single live testnet employee stream. Yield leg is supplied to Blend; buffer stays liquid for instant unlocks."
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
