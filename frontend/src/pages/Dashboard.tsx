import {
  Activity,
  ArrowDownRight,
  Clock3,
  GitBranch,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { EmployeeBalance, EmployeeSession, EmployerConnection } from "../sdk/yieldflow-sdk";
import type { DisplayStats } from "../types";
import { formatMoney, shortAddress } from "../utils";
import { useRipple } from "../animation-utils";
import { ActivityList } from "../components/activity/ActivityList";
import type { ActivityItem } from "../sdk/yieldflow-sdk";

type DashboardProps = {
  employer: EmployerConnection | null;
  employee: EmployeeSession | null;
  balance: EmployeeBalance | null;
  displayStats: DisplayStats;
  liveBalance: number;
  streamProgress: number;
  activity: ActivityItem[];
  authenticating: boolean;
  withdrawing: boolean;
  expandedActivityId: string | null;
  onToggleExpand: (id: string | null) => void;
  onLogin: () => void;
  onWithdraw: () => void;
  onNavigate: (page: "flows" | "activity" | "dashboard") => void;
};

export default function Dashboard({
  employee,
  balance,
  displayStats,
  liveBalance,
  streamProgress,
  activity,
  authenticating,
  withdrawing,
  expandedActivityId,
  onToggleExpand,
  onLogin,
  onWithdraw,
  onNavigate,
}: DashboardProps) {
  const ripple = useRipple();
  const activeProof = employee ? shortAddress(employee.walletAddress) : "Connect to begin";
  const recentActivity = activity.slice(0, 3);

  return (
    <section className="dashboard-grid page-enter">
      <article className="metric-card accent">
        <div className="metric-top">
          <span>Total pool</span>
          <Sparkles size={16} />
        </div>
        <strong>{displayStats.totalPool}</strong>
        <small>Capital under yield allocation</small>
      </article>

      <article className="metric-card">
        <div className="metric-top">
          <span>Yield earned</span>
          <span>{displayStats.projectedApy}% APY</span>
        </div>
        <strong>{displayStats.yieldEarned}</strong>
        <small>Accumulated from underlying streams</small>
      </article>

      <article className="metric-card">
        <div className="metric-top">
          <span>Buffer reserve</span>
          <span>{displayStats.bufferPercent}%</span>
        </div>
        <strong>{displayStats.bufferAmount}</strong>
        <small>Liquidity kept for instant withdrawals</small>
      </article>

      <article className="metric-card">
        <div className="metric-top">
          <span>Active employees</span>
          <span>Live</span>
        </div>
        <strong>{displayStats.activeEmployees}</strong>
        <small>Staff receiving streamed pay</small>
      </article>

      <section className="flow-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Live stream summary</p>
            <h2>Continuous wage settlement</h2>
          </div>
          <span className="chip">{employee ? "Flowing now" : "Offline"}</span>
        </div>

        {employee && balance ? (
          <>
            <p className="live-amount">
              {formatMoney(liveBalance, 2)}
              <small>{Number(balance.ratePerSecond).toFixed(4)} USDC/sec</small>
            </p>

            <div className="stream-progress">
              <div className="stream-progress-top">
                <span>Next payday</span>
                <span>{balance.nextPayday}</span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${streamProgress}%` }} />
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty">
            <strong>Stream offline</strong>
            <p>Sign in with Passkey to see the live unlocked balance summary.</p>
          </div>
        )}

        <div className="dashboard-actions">
          {!employee ? (
            <button
              className="primary-btn"
              type="button"
              onClick={(e) => {
                ripple(e);
                onLogin();
              }}
              disabled={authenticating}
            >
              {authenticating ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
              {authenticating ? "Authenticating..." : "Sign in with Passkey"}
            </button>
          ) : (
            <button className="primary-btn" type="button" onClick={() => onNavigate("flows")}>
              <GitBranch size={16} />
              Open Flows to fund
            </button>
          )}
          <button className="secondary-btn" type="button" onClick={() => onNavigate("activity")}>
            <Activity size={16} />
            Open Activity to audit
          </button>
        </div>
      </section>

      <section className="chart-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Pipeline mini-map</p>
            <h2>How capital hops</h2>
          </div>
          <button className="chip chip-btn" type="button" onClick={() => onNavigate("flows")}>
            Operate in Flows
          </button>
        </div>

        <div className="flow-map">
          <div className="flow-node active">
            <div>
              <Wallet size={18} />
            </div>
            Employer pool
          </div>
          <div className="flow-arrow" aria-hidden="true">
            &rarr;
          </div>
          <div className="flow-node active">
            <div>
              <Layers size={18} />
            </div>
            Yield vault
          </div>
          <div className="flow-arrow" aria-hidden="true">
            &rarr;
          </div>
          <div className="flow-node active">
            <div>
              <Activity size={18} />
            </div>
            Employee streams
          </div>
        </div>

        <p className="muted mini-map-note">
          Read-only overview. Fund payroll, tune allocation, and run withdrawals on Flows.
        </p>
      </section>

      <section className="activity-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Recent events</p>
            <h2>Last 3 motions</h2>
          </div>
          <button className="chip chip-btn" type="button" onClick={() => onNavigate("activity")}>
            View all activity
          </button>
        </div>
        <div className="activity-list">
          {recentActivity.length ? (
            <ActivityList
              items={recentActivity}
              compact
              expandedActivityId={expandedActivityId}
              onToggleExpand={onToggleExpand}
            />
          ) : (
            <div className="empty-state compact-empty">
              <strong>No events yet</strong>
              <p>Fund payroll or withdraw on Flows to seed the ledger.</p>
            </div>
          )}
        </div>
      </section>

      <section className="live-balance-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Session snapshot</p>
            <h2>Employee access</h2>
          </div>
          <span className="chip">{employee ? "Active" : "Offline"}</span>
        </div>

        <div className="wallet-line">
          <strong>{employee ? employee.name : "Not signed in"}</strong>
          <small>{employee ? activeProof : "Passkey login required"}</small>
        </div>

        <button
          className="primary-btn"
          type="button"
          onClick={(e) => {
            ripple(e);
            onLogin();
          }}
          disabled={authenticating}
        >
          {authenticating ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
          {authenticating
            ? "Authenticating..."
            : employee
              ? "Restore session"
              : "Sign in with Passkey"}
        </button>

        <section className="mini-grid session-mini-grid">
          <article className="metric-card">
            <div className="metric-top">
              <span>Wallet</span>
              <Wallet size={14} />
            </div>
            <strong>{employee ? shortAddress(employee.walletAddress) : "-"}</strong>
            <small>Connected employee account</small>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Authorization</span>
              <Clock3 size={14} />
            </div>
            <strong>{employee ? "Active" : "Offline"}</strong>
            <small>Passkey session state</small>
          </article>
        </section>
      </section>

      <section className="withdraw-panel glass-panel">
        <div className="panel-header">
          <div>
            <p className="label">Quick withdraw</p>
            <h2>Unlocked balance only</h2>
          </div>
          <span className="chip">One-click</span>
        </div>

        <p className="muted">
          Read-only unlocked amount with a one-click payout. Full exit path and locked funds live on
          Flows.
        </p>

        <div className="setting-row withdraw-available">
          <strong>{balance ? formatMoney(Number(balance.unlockedAmount), 2) : "--"}</strong>
          <small>Available unlocked amount</small>
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

        <button className="chip chip-btn full-width-chip" type="button" onClick={() => onNavigate("flows")}>
          Manage full exit on Flows
        </button>
      </section>
    </section>
  );
}
