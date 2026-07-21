import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleDot,
  Layers,
  Loader2,
  ShieldCheck,
  Wallet,
  FlaskConical,
} from "lucide-react";
import type {
  DepositPreview,
  EmployeeBalance,
  EmployeeSession,
  EmployerConnection,
  EmployerStats,
  StreamPhysics,
} from "../sdk/yieldflow-sdk";
import { getStreamPhysics, previewDeposit } from "../sdk/yieldflow-sdk";
import type { DisplayStats, QueuedTx } from "../types";
import { formatMoney, hopTimeline } from "../utils";
import { useRipple } from "../animation-utils";

type FlowsProps = {
  employer: EmployerConnection | null;
  employee: EmployeeSession | null;
  balance: EmployeeBalance | null;
  displayStats: DisplayStats;
  liveBalance: number;
  streamProgress: number;
  activeTx: QueuedTx | undefined;
  transactionQueue: QueuedTx[];
  stats: EmployerStats | null;
  depositing: boolean;
  withdrawing: boolean;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onNavigate: (page: "dashboard" | "activity" | "flows") => void;
};

export default function Flows({
  employer,
  employee,
  balance,
  displayStats,
  liveBalance,
  streamProgress,
  activeTx,
  transactionQueue,
  stats,
  depositing,
  withdrawing,
  depositAmount,
  onDepositAmountChange,
  onDeposit,
  onWithdraw,
  onNavigate,
}: FlowsProps) {
  const ripple = useRipple();
  const [preview, setPreview] = useState<DepositPreview | null>(null);
  const [physics, setPhysics] = useState<StreamPhysics | null>(null);
  const [scenarioAmount, setScenarioAmount] = useState("25000");
  const [scenario, setScenario] = useState<DepositPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    void previewDeposit(depositAmount).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [depositAmount]);

  useEffect(() => {
    if (!employee) {
      setPhysics(null);
      return;
    }
    let cancelled = false;
    void getStreamPhysics(employee.employeeId).then((result) => {
      if (!cancelled) setPhysics(result);
    });
    const timer = window.setInterval(() => {
      void getStreamPhysics(employee.employeeId).then((result) => {
        if (!cancelled) setPhysics(result);
      });
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [employee]);

  useEffect(() => {
    let cancelled = false;
    void previewDeposit(scenarioAmount).then((result) => {
      if (!cancelled) setScenario(result);
    });
    return () => {
      cancelled = true;
    };
  }, [scenarioAmount]);

  const flowStages = useMemo(
    () => [
      {
        id: "employer",
        title: "Employer pool",
        subtitle: employer ? "Connected" : "Awaiting connect",
        icon: Wallet,
        active: Boolean(employer),
      },
      {
        id: "vault",
        title: "Yield vault",
        subtitle: stats ? `${displayStats.yieldRoutePercent}% route` : "Idle",
        icon: Layers,
        active: Boolean(stats),
      },
      {
        id: "stream",
        title: "Stream engine",
        subtitle: `${displayStats.activeEmployees} active`,
        icon: Activity,
        active: Boolean(employee || stats),
      },
      {
        id: "wallet",
        title: "Wallet settlement",
        subtitle: employee ? "Passkey ready" : "Auth required",
        icon: ShieldCheck,
        active: Boolean(employee),
      },
    ],
    [employer, stats, employee, displayStats],
  );

  const amountNum = Number(depositAmount.replace(/[^0-9.]/g, "")) || 0;
  const hops = hopTimeline(activeTx);

  return (
    <section className="dashboard-grid page-enter">
      <section className="chart-panel glass-panel flow-full">
        <div className="panel-header">
          <div>
            <p className="label">Pipeline canvas</p>
            <h2>End-to-end capital flow</h2>
          </div>
          <span className="chip">{activeTx ? activeTx.status : "stable"}</span>
        </div>

        <div className="flow-map flow-map-extended">
          {flowStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flow-stage">
                <div className={`flow-node${stage.active ? " active" : ""}`}>
                  <div>
                    <Icon size={18} />
                  </div>
                  <strong>{stage.title}</strong>
                  <small>{stage.subtitle}</small>
                </div>
                {index < flowStages.length - 1 && (
                  <div className="flow-arrow" aria-hidden="true">
                    &rarr;
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="tx-status">
          <div className="tx-header">
            <span>Current operation hops</span>
            <strong className={activeTx ? "tx-live" : undefined}>
              {activeTx ? `${activeTx.kind} · ${activeTx.status}` : "No pending hops"}
            </strong>
          </div>
          <div className="hop-timeline" aria-label="Transaction hop timeline">
            {hops.map((hop) => (
              <div key={hop.id} className={`hop-step ${hop.state}`}>
                <span className="hop-dot" />
                <div>
                  <strong>{hop.label}</strong>
                  <small>{hop.detail}</small>
                </div>
              </div>
            ))}
          </div>
          {activeTx && (
            <div className="tx-hash">
              <code>{activeTx.txHash.slice(0, 14)}...</code>
              <span>{activeTx.amount}</span>
            </div>
          )}
        </div>
      </section>

      <section className="allocation-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Allocation policy</p>
            <h2>Buffer vs yield route</h2>
          </div>
          <span className="chip">{displayStats.projectedApy}% APY</span>
        </div>

        <div className="allocation-stack">
          <div className="allocation-row">
            <div className="allocation-meta">
              <span>Yield route</span>
              <strong>{displayStats.yieldRoutePercent}%</strong>
            </div>
            <div className="allocation-bar">
              <span style={{ width: `${displayStats.yieldRoutePercent}%` }} />
            </div>
          </div>
          <div className="allocation-row">
            <div className="allocation-meta">
              <span>Instant buffer</span>
              <strong>{displayStats.bufferPercent}%</strong>
            </div>
            <div className="allocation-bar buffer-bar">
              <span style={{ width: `${displayStats.bufferPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="allocation-legend">
          <span>
            <i style={{ background: "var(--berry)" }} /> Yield vault · {displayStats.yieldEarned}
          </span>
          <span>
            <i style={{ background: "var(--orange)" }} /> Buffer · {displayStats.bufferAmount}
          </span>
        </div>
      </section>

      <section className="flow-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Fund payroll wizard</p>
            <h2>Inject capital into the pool</h2>
          </div>
          <span className="chip">Deposit</span>
        </div>

        {!employee ? (
          <div className="empty-state compact-empty">
            <strong>Sign in required</strong>
            <p>Authenticate on Dashboard before funding payroll.</p>
            <button className="secondary-btn" type="button" onClick={() => onNavigate("dashboard")}>
              <ShieldCheck size={16} />
              Sign in on Dashboard
            </button>
          </div>
        ) : (
          <>
            <label className="field-label" htmlFor="deposit-amount">
              Amount (USDC)
            </label>
            <input
              id="deposit-amount"
              className="field-input"
              value={depositAmount}
              onChange={(e) => onDepositAmountChange(e.target.value)}
              inputMode="decimal"
              placeholder="50000"
            />

            <div className="split-preview">
              <div className="setting-row">
                <strong>
                  {preview
                    ? formatMoney(Number(preview.bufferShare), 2)
                    : formatMoney((amountNum * displayStats.bufferPercent) / 100, 2)}
                </strong>
                <small>Buffer ({preview?.bufferPercent ?? displayStats.bufferPercent}%)</small>
              </div>
              <div className="setting-row">
                <strong>
                  {preview
                    ? formatMoney(Number(preview.yieldShare), 2)
                    : formatMoney((amountNum * displayStats.yieldRoutePercent) / 100, 2)}
                </strong>
                <small>
                  Yield route ({preview?.yieldRoutePercent ?? displayStats.yieldRoutePercent}%)
                </small>
              </div>
              <div className="setting-row">
                <strong>{preview?.projectedApy ?? displayStats.projectedApy}%</strong>
                <small>Projected APY after deposit</small>
              </div>
            </div>

            <button
              className="primary-btn"
              type="button"
              onClick={(e) => {
                ripple(e);
                onDeposit();
              }}
              disabled={depositing || amountNum <= 0}
            >
              {depositing ? <Loader2 className="spin" size={16} /> : <ArrowUpRight size={16} />}
              {depositing ? "Funding payroll..." : "Fund payroll"}
            </button>
          </>
        )}
      </section>

      <section className="live-balance-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Stream physics</p>
            <h2>Wage unlocking in real time</h2>
          </div>
          <span className="chip">
            <CircleDot size={12} /> Live
          </span>
        </div>

        {employee && balance ? (
          <>
            <p className="live-amount">
              {formatMoney(liveBalance, 2)}
              <small>{Number(balance.ratePerSecond).toFixed(5)} USDC/sec</small>
            </p>

            <div className="stream-progress">
              <div className="stream-progress-top">
                <span>
                  Unlocked{" "}
                  {physics
                    ? `${physics.unlockedPercent.toFixed(1)}%`
                    : `${streamProgress.toFixed(1)}%`}
                </span>
                <span>
                  Cap{" "}
                  {physics
                    ? formatMoney(Number(physics.streamCap), 2)
                    : formatMoney(Number(balance.streamCap), 2)}
                </span>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${physics ? physics.unlockedPercent : streamProgress}%`,
                  }}
                />
              </div>
            </div>

            <div className="physics-grid">
              <div className="setting-row">
                <strong>
                  {physics
                    ? formatMoney(Number(physics.lockedAmount), 2)
                    : "--"}
                </strong>
                <small>Still locked</small>
              </div>
              <div className="setting-row">
                <strong>
                  {physics ? `${physics.bufferCoverageHours}h` : "--"}
                </strong>
                <small>Buffer coverage</small>
              </div>
              <div className="setting-row">
                <strong>{balance.nextPayday}</strong>
                <small>
                  ~{physics ? Math.round(physics.secondsToPayday / 86400) : 14} days to payday
                </small>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty">
            <strong>No active stream</strong>
            <p>Sign in on Dashboard to drive stream rate and unlocked balance.</p>
            <button className="secondary-btn" type="button" onClick={() => onNavigate("dashboard")}>
              Go to Dashboard
            </button>
          </div>
        )}
      </section>

      <section className="withdraw-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Exit / withdraw</p>
            <h2>Settle to wallet</h2>
          </div>
          <span className="chip">Full exit path</span>
        </div>

        <p className="muted">
          Pull unlocked USDC from the stream into the passkey-bound wallet settlement path.
        </p>

        <div className="setting-row">
          <strong>{balance ? formatMoney(Number(balance.unlockedAmount), 2) : "--"}</strong>
          <small>Available now (unlocked)</small>
        </div>

        <button
          className="secondary-btn"
          type="button"
          onClick={(e) => {
            ripple(e);
            onWithdraw();
          }}
          disabled={!employee || withdrawing || !balance}
        >
          {withdrawing ? <Loader2 className="spin" size={16} /> : <ArrowDownRight size={16} />}
          {withdrawing ? "Withdrawing..." : "Request payout"}
        </button>

        <button
          className="chip chip-btn full-width-chip"
          type="button"
          onClick={() => onNavigate("activity")}
        >
          Audit settlement on Activity
        </button>
      </section>

            <section className="chart-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Scenario mode</p>
            <h2>What if I fund X?</h2>
          </div>
          <span className="chip">
            <FlaskConical size={12} /> Employer value
          </span>
        </div>

        <p className="muted">
          Employer savings framing: idle payroll on the yield route keeps working until it streams.
        </p>

        <label className="field-label" htmlFor="scenario-amount">
          Hypothetical deposit (USDC)
        </label>
        <input
          id="scenario-amount"
          className="field-input"
          value={scenarioAmount}
          onChange={(e) => setScenarioAmount(e.target.value)}
          inputMode="decimal"
        />

        <div className="split-preview">
          <div className="setting-row">
            <strong>
              {scenario ? formatMoney(Number(scenario.bufferShare), 2) : "--"}
            </strong>
            <small>Would go to buffer (instant withdrawals)</small>
          </div>
          <div className="setting-row">
            <strong>
              {scenario ? formatMoney(Number(scenario.yieldShare), 2) : "--"}
            </strong>
            <small>Would go to yield route (working capital)</small>
          </div>
          <div className="setting-row">
            <strong>{scenario?.projectedApy ?? "--"}%</strong>
            <small>Projected APY on yield-routed share</small>
          </div>
          <div className="setting-row">
            <strong>
              {scenario
                ? formatMoney(
                    (Number(scenario.yieldShare) * Number(scenario.projectedApy || 0)) / 100 / 12,
                    2,
                  )
                : "--"}
            </strong>
            <small>Illustrative monthly yield (demo math)</small>
          </div>
        </div>
      </section>
    </section>
  );
}
