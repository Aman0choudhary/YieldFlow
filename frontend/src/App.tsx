import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Layers,
  Loader2,
  Sparkles,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import {
  connectEmployer,
  depositPayroll,
  getActivity,
  getEmployeeBalance,
  getEmployerStats,
  getTransactionStatus,
  loginEmployee,
  restoreEmployeeSession,
  withdraw,
} from "./sdk/yieldflow-sdk";
import type {
  ActivityItem,
  EmployeeBalance,
  EmployeeSession,
  EmployerStats,
  EmployerConnection,
  TxStatus,
} from "./sdk/yieldflow-sdk";
import { useAnimatedNumber, formatRelativeTime } from "./animation-utils";

const kindIcons = {
  deposit: ArrowUpRight,
  withdraw: ArrowDownRight,
  stream: Layers,
  yield: Sparkles,
  auth: Wallet,
} as const;

const kindLabel: Record<ActivityItem['kind'], string> = {
  deposit: "Payroll deposit",
  withdraw: "Withdraw settled",
  stream: "Employee stream",
  yield: "Yield harvested",
  auth: "Passkey restored",
};

const formatMoney = (value: number, digits = 2) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const shortAddress = (address: string) =>
  `${address.slice(0, 8)}...${address.slice(-6)}`;

const toastStyle = {
  deposit: "info",
  withdraw: "warning",
  confirmed: "success",
  failed: "error",
} as const;

const initialNotifications: Array<{
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "error";
  timestamp: number;
}> = [];

const payrollDepositAmount = "1";

export default function App() {
  const [employer, setEmployer] = useState<EmployerConnection | null>(null);
  const [employee, setEmployee] = useState<EmployeeSession | null>(null);
  const [balance, setBalance] = useState<EmployeeBalance | null>(null);
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("Ready to flow capital.");
  const [authenticating, setAuthenticating] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [transactionQueue, setTransactionQueue] = useState<{
    txHash: string;
    status: TxStatus;
    kind: "deposit" | "withdraw";
    amount: string;
    startedAt: number;
  }[]>([]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [liveTarget, setLiveTarget] = useState(0);
  
  const activeTx = transactionQueue.find((tx) => tx.status === "pending" || tx.status === "submitted");

  const liveBalance = useAnimatedNumber(liveTarget, 500);

  useEffect(() => {
    const init = async () => {
      try {
        setStatusMessage("Booting yield engine...");
        const [connection, statsResponse, activityResponse] = await Promise.all([
          connectEmployer(),
          getEmployerStats(),
          getActivity(),
        ]);

        setEmployer(connection);
        setStats(statsResponse);
        setActivity(activityResponse);

        const restore = await restoreEmployeeSession();
        if (restore.employeeId) {
          setEmployee({
            employeeId: restore.employeeId,
            name: "Aditiya Sharma",
            walletAddress: "CCONTRACT...PASSKEY...YF01",
          });
          const nextBalance = await getEmployeeBalance(restore.employeeId);
          setBalance(nextBalance);
        }

        setStatusMessage("Ready to flow capital.");
      } catch (error) {
        console.error(error);
        setStatusMessage("Unable to initialize. Refresh to retry.");
      }
    };

    void init();
  }, []);

  useEffect(() => {
    if (!balance) {
      setLiveTarget(0);
      return;
    }

    const base = parseFloat(balance.unlockedAmount);
    const rate = parseFloat(balance.ratePerSecond);
    const startTime = Date.now();
    setLiveTarget(base);

    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setLiveTarget(base + elapsed * rate);
    }, 280);

    return () => window.clearInterval(timer);
  }, [balance]);

  useEffect(() => {
    if (!transactionQueue.some((tx) => tx.status === "pending")) {
      return;
    }

    const poll = window.setInterval(() => {
      transactionQueue.forEach(async (tx) => {
        if (tx.status !== "pending") return;
        const status = await getTransactionStatus(tx.txHash);
        if (status === tx.status) return;

        setTransactionQueue((current) =>
          current.map((item) => (item.txHash === tx.txHash ? { ...item, status } : item)),
        );

        if (status === "confirmed") {
          addNotification(`Transaction confirmed`, "success");
          setStatusMessage("Transaction confirmed. Yield is live.");
          if (employee) {
            const refreshed = await getEmployeeBalance(employee.employeeId);
            setBalance(refreshed);
          }
        }

        if (status === "failed") {
          addNotification(`Transaction failed`, "error");
          setStatusMessage("Transaction failed. Try again.");
        }
      });
    }, 1800);

    return () => window.clearInterval(poll);
  }, [transactionQueue, employee]);

  useEffect(() => {
    if (!notifications.length) return;
    const timer = window.setTimeout(() => {
      setNotifications((current) => current.slice(1));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [notifications]);

  const addNotification = useCallback(
    (message: string, type: "info" | "success" | "error") => {
      const next = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: type === "success" ? "Success" : type === "error" ? "Failed" : "Update",
        message,
        type,
        timestamp: Date.now(),
      };
      setNotifications((current) => [next, ...current].slice(0, 4));
    },
    [],
  );

  const handleLogin = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    setStatusMessage("Authenticating with Passkey...");

    try {
      const session = await loginEmployee();
      setEmployee(session);
      addNotification("Passkey login complete.", "success");
      setStatusMessage(`Welcome back, ${session.name.split(" ")[0]}.`);
      const nextBalance = await getEmployeeBalance(session.employeeId);
      setBalance(nextBalance);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      addNotification(message, "error");
      setStatusMessage("Passkey authentication failed.");
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDeposit = async () => {
    if (!employee || depositing) return;
    setDepositing(true);
    setStatusMessage("Submitting payroll funding...");

    try {
      const result = await depositPayroll(payrollDepositAmount);
      const nextStatus: TxStatus = result.status === "failed" ? "failed" : "pending";
      const nextTx = {
        txHash: result.txHash,
        status: nextStatus,
        kind: "deposit" as const,
        amount: `$${payrollDepositAmount}`,
        startedAt: Date.now(),
      };
      setTransactionQueue((current) => [nextTx, ...current].slice(0, 5));

      if (result.status === "failed") {
        addNotification("Payroll funding failed to submit.", "error");
        setStatusMessage("Payroll funding error.");
      } else {
        addNotification("Payroll funding is in motion.", "info");
        setStatusMessage("Payroll submitted. Confirming... ");
        setActivity((current) => [
          {
            id: `deposit-${result.txHash}`,
            kind: "deposit",
            label: "Payroll deposit",
            timestamp: "Just now",
            amount: `+${payrollDepositAmount} USDC`,
          } as ActivityItem,
          ...current,
        ].slice(0, 8));
      }
    } catch (error) {
      addNotification("Unable to submit payroll.", "error");
      setStatusMessage("Payroll submission failed.");
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!employee || withdrawing || !balance) return;
    setWithdrawing(true);
    setStatusMessage("Requesting withdrawal...");

    try {
      const result = await withdraw(employee.employeeId);
      const nextStatus: TxStatus = result.status === "failed" ? "failed" : "pending";
      const nextTx = {
        txHash: result.txHash,
        status: nextStatus,
        kind: "withdraw" as const,
        amount: `$${Number(result.amountReceived).toFixed(2)}`,
        startedAt: Date.now(),
      };
      setTransactionQueue((current) => [nextTx, ...current].slice(0, 5));

      if (result.status === "failed") {
        addNotification("Withdrawal failed to submit.", "error");
        setStatusMessage("Withdrawal error.");
      } else {
        addNotification("Withdrawal request queued.", "info");
        setStatusMessage("Withdrawal submitted. Awaiting final settlement.");
        setActivity((current) => [
          {
            id: `withdraw-${result.txHash}`,
            kind: "withdraw",
            label: "Payout withdrawal",
            timestamp: "Just now",
            amount: `-${Number(result.amountReceived).toFixed(2)} USDC`,
          } as ActivityItem,
          ...current,
        ].slice(0, 8));
      }
    } catch (error) {
      addNotification("Unable to withdraw right now.", "error");
      setStatusMessage("Withdrawal failed.");
    } finally {
      setWithdrawing(false);
    }
  };

  const activeProof = employee ? shortAddress(employee.walletAddress) : "Connect to begin";

  const displayStats = useMemo(
    () => ({
      totalPool: stats ? formatMoney(parseFloat(stats.totalPool)) : "--",
      yieldEarned: stats ? formatMoney(parseFloat(stats.yieldEarned)) : "--",
      bufferAmount: stats ? formatMoney(parseFloat(stats.bufferAmount)) : "--",
      activeEmployees: stats ? stats.activeEmployees : 0,
      projectedApy: stats?.projectedApy ?? "--",
    }),
    [stats],
  );

  return (
    <div className="app-shell">
      <div className="background-lines">
        <div className="line line-one" />
        <div className="line line-two" />
        <div className="line line-three" />
      </div>

      <section className="top-shell">
        <button className="brand-mark" type="button">
          <span className="brand-glyph">YF</span>
          YieldFlow
        </button>

        <div className="pill-nav">
          <button className="nav-item active" type="button">
            Dashboard
          </button>
          <button className="nav-item" type="button">
            Flows
          </button>
          <button className="nav-item" type="button">
            Activity
          </button>
        </div>

        <div className="status-pill">
          <span className="status-dot" />
          <span>{statusMessage}</span>
        </div>
      </section>

      <main className="main-canvas">
        <section className="screen-section compact-screen hero-block">
          <span className="eyebrow">Premium payroll yield orchestration</span>
          <h1>
            Animate workplace payroll, capture yield, and keep every employee flow connected.
          </h1>
          <p>
            The app now surfaces transactional movement, confirms each step with motion, and keeps the live stream balance visually in sync with every activity.
          </p>
        </section>

        <section className="dashboard-grid">
          <article className="metric-card accent">
            <div className="metric-top">
              <span>Total pool</span>
              <Sparkles />
            </div>
            <strong>{displayStats.totalPool}</strong>
            <small>Capital under yield allocation</small>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Yield earned</span>
              <span>{stats?.projectedApy}% APY</span>
            </div>
            <strong>{displayStats.yieldEarned}</strong>
            <small>Accumulated from underlying streams</small>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Buffer reserve</span>
              <span>{stats?.bufferPercent}%</span>
            </div>
            <strong>{displayStats.bufferAmount}</strong>
            <small>Liquidity kept for instant withdrawals</small>
          </article>

          <article className="metric-card">
            <div className="metric-top">
              <span>Active employees</span>
              <span>{stats?.projectedApy}%</span>
            </div>
            <strong>{displayStats.activeEmployees}</strong>
            <small>Live staff receiving streamed pay</small>
          </article>

          <section className="flow-panel glass-panel">
            <div className="panel-header">
              <div>
                <p className="label">Live employee stream</p>
                <h2>Continuous wage settlement</h2>
              </div>
              <span className="chip">Flowing now</span>
            </div>

            <p className="live-amount">
              {formatMoney(liveBalance, 2)}
              <small>{balance ? `${Number(balance.ratePerSecond).toFixed(4)} USDC/sec` : "0.0000 USDC/sec"}</small>
            </p>

            <div className="stream-progress">
              <div className="stream-progress-top">
                <span>Next payday</span>
                <span>{balance?.nextPayday ?? "Waiting"}</span>
              </div>
              <div className="progress-track">
                <span style={{ width: stats ? `${Math.min(100, (Number(balance?.unlockedAmount ?? 0) / Number(balance?.streamCap ?? 1)) * 100)};%` : "0%" }} />
              </div>
            </div>

            <button className="primary-btn" type="button" onClick={handleDeposit} disabled={depositing || !employee}>
              {depositing ? <Loader2 className="spin" /> : <ArrowUpRight />}
              {depositing ? "Funding payroll…" : "Fund payroll"}
            </button>
          </section>

          <section className="chart-panel glass-panel">
            <div className="panel-header">
              <div>
                <p className="label">Activity map</p>
                <h2>Connected settlement flow</h2>
              </div>
              <span className="chip">Momentum</span>
            </div>

            <div className="flow-map">
              <div className="flow-node active">
                <div>
                  <Wallet />
                </div>
                Employer pool
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-node active">
                <div>
                  <Layers />
                </div>
                Yield vault
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-node active">
                <div>
                  <Activity />
                </div>
                Employee streams
              </div>
            </div>

            <div className="tx-status">
              <div className="tx-header">
                <span>Latest transaction</span>
                <strong>{activeTx?.status ?? "idle"}</strong>
              </div>
              <div className="tx-steps">
                <span className={activeTx?.status === "pending" ? "current" : activeTx?.status === "confirmed" ? "done" : ""}>
                  {activeTx ? activeTx.kind : "no activity"}
                </span>
                <span className={activeTx?.status === "confirmed" ? "done" : ""}>
                  confirmed
                </span>
              </div>
              {activeTx && (
                <div className="tx-hash">
                  <code>{activeTx.txHash.slice(0, 12)}...</code>
                  <span>{activeTx.amount}</span>
                </div>
              )}
            </div>
          </section>

          <section className="activity-panel glass-panel">
            <div className="panel-header">
              <div>
                <p className="label">Activity feed</p>
                <h2>Recent motion</h2>
              </div>
              <span className="chip">Live</span>
            </div>

            <div className="activity-list">
              {activity.map((item) => {
                const Icon = kindIcons[item.kind] ?? Activity;
                return (
                  <div className="activity-row" key={item.id}>
                    <div className="activity-icon" style={{ background: item.kind === "withdraw" ? "rgba(255, 103, 102, 0.18)" : "rgba(202, 40, 81, 0.14)" }}>
                      <Icon />
                    </div>
                    <div>
                      <strong>{item.label ?? kindLabel[item.kind]}</strong>
                      <small>{item.timestamp}</small>
                    </div>
                    <div className="activity-amount">{item.amount}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="live-balance-panel glass-panel">
            <div className="panel-header">
              <div>
                <p className="label">Session snapshot</p>
                <h2>Employee access</h2>
              </div>
              <span className="chip">Fast auth</span>
            </div>

            <div className="wallet-line">
              <strong>{employee ? employee.name : "Not signed in"}</strong>
              <small>{employee ? activeProof : "Passkey login required"}</small>
            </div>

            <button className="primary-btn" type="button" onClick={handleLogin} disabled={authenticating}>
              {authenticating ? <Loader2 className="spin" /> : <ShieldCheck />}
              {authenticating ? "Authenticating..." : employee ? "Restore session" : "Sign in with Passkey"}
            </button>

            <section className="mini-grid" style={{ marginTop: 24 }}>
              <article className="metric-card">
                <div className="metric-top">
                  <span>Wallet</span>
                  <Wallet />
                </div>
                <strong>{employee ? shortAddress(employee.walletAddress) : "—"}</strong>
                <small>Connected employee account</small>
              </article>

              <article className="metric-card">
                <div className="metric-top">
                  <span>Authorization</span>
                  <Clock3 />
                </div>
                <strong>{employee ? "Active" : "Offline"}</strong>
                <small>Passkey session state</small>
              </article>
            </section>
          </section>

          <section className="withdraw-panel glass-panel">
            <div className="panel-header">
              <div>
                <p className="label">Withdraw liquidity</p>
                <h2>Instant payout request</h2>
              </div>
              <span className="chip">One-click</span>
            </div>

            <p className="muted">
              Withdraw your available unlocked balance from the live stream to wallet settlement.
            </p>

            <button className="secondary-btn" type="button" onClick={handleWithdraw} disabled={!employee || withdrawing || !balance}>
              {withdrawing ? <Loader2 className="spin" /> : <ArrowDownRight />}
              {withdrawing ? "Withdrawing…" : "Request payout"}
            </button>

            <div className="setting-row" style={{ marginTop: 20 }}>
              <strong>{balance ? formatMoney(Number(balance.unlockedAmount), 2) : "--"}</strong>
              <small>Available unlocked amount</small>
            </div>
          </section>
        </section>
      </main>

      <div className="toast-stack">
        {notifications.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-header">
              <strong>{toast.title}</strong>
              <small>{formatRelativeTime(toast.timestamp)}</small>
            </div>
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
