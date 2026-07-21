import { useCallback, useEffect, useRef, useState } from "react";
import {
  depositPayroll,
  getActivity,
  getEmployerStats,
  getSdkMeta,
  resetDemo,
  withdraw,
} from "./sdk/yieldflow-sdk";
import type { TxStatus } from "./sdk/yieldflow-sdk";
import { useRipple, formatRelativeTime } from "./animation-utils";
import { Settings2 } from "lucide-react";

import { useSession } from "./hooks/useSession";
import { useStats } from "./hooks/useStats";
import { useStreamBalance } from "./hooks/useStreamBalance";
import { useTransactions } from "./hooks/useTransactions";
import { useActivity } from "./hooks/useActivity";
import { useNotifications } from "./hooks/useNotifications";

import Dashboard from "./pages/Dashboard";
import Flows from "./pages/Flows";
import ActivityPage from "./pages/Activity";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ReceiptDialog, type ReceiptData } from "./components/ReceiptDialog";
import { HealthStrip } from "./components/HealthStrip";
import { SettingsPanel } from "./components/SettingsPanel";

import type { AppPage, QueuedTx } from "./types";
import { navItems, pageCopy, parseHashPage, pageToHash } from "./utils";

type PendingConfirm = {
  type: "deposit" | "withdraw";
  amount: string;
} | null;

export default function App() {
  /* -- routing -- */
  const [page, setPage] = useState<AppPage>(
    () => parseHashPage(window.location.hash) ?? "dashboard",
  );
  const mainRef = useRef<HTMLElement>(null);

  const navigate = useCallback((next: AppPage) => {
    setPage(next);
    window.location.hash = pageToHash(next);
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const target = parseHashPage(window.location.hash);
      if (target) setPage(target);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* -- shared hooks -- */
  const { notifications, addNotification } = useNotifications();
  const {
    activity, setActivity, activityFilter, setActivityFilter,
    statusFilter, setStatusFilter, searchQuery, setSearchQuery,
    expandedActivityId, setExpandedActivityId, detailItem, setDetailItem,
    filteredActivity, reloadActivity, exportCsv, patchActivityStatus,
  } = useActivity();
  const {
    employer, employee, balance, authenticating,
    initEmployer, restoreSession, handleLogin, refreshBalance, clearSession,
  } = useSession(addNotification, reloadActivity);
  const { stats, setStats, displayStats } = useStats();
  const { liveBalance, streamProgress } = useStreamBalance(balance);
  const { transactionQueue, activeTx, queueTransaction } = useTransactions(
    employee?.employeeId ?? null,
    addNotification,
    refreshBalance,
    setStats,
    patchActivityStatus,
    reloadActivity,
  );

  /* -- boot / shell -- */
  const [booting, setBooting] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Ready to flow capital.");
  const [depositAmount, setDepositAmount] = useState("50000");
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const sdkMeta = getSdkMeta();
  const networkLabel = sdkMeta.mode === "mock" ? "Mock local" : "Stellar Testnet";
  const ripple = useRipple();

  useEffect(() => {
    const init = async () => {
      try {
        setStatusMessage("Booting yield engine...");
        const [, statsRes, activityRes] = await Promise.all([
          initEmployer(),
          getEmployerStats(),
          getActivity(),
        ]);
        setStats(statsRes);
        setActivity(activityRes);
        await restoreSession();
        setStatusMessage(
          sdkMeta.mode === "mock"
            ? "Ready to flow capital (mock)."
            : "Ready to flow capital (stellar).",
        );
      } catch (error) {
        console.error(error);
        setStatusMessage("Unable to initialize. Refresh to retry.");
      } finally {
        setBooting(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -- keyboard: Escape closes overlays -- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "Escape") {
        setPendingConfirm(null);
        setReceipt(null);
        setSettingsOpen(false);
        setDetailItem(null);
        return;
      }
      if (typing) return;
      if (event.key === "1") navigate("dashboard");
      if (event.key === "2") navigate("flows");
      if (event.key === "3") navigate("activity");
      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDetailItem, navigate]);

  /* -- handlers -- */
  const onLogin = useCallback(async () => {
    setStatusMessage("Authenticating with Passkey...");
    const session = await handleLogin();
    if (session) {
      setStatusMessage(`Welcome back, ${session.name.split(" ")[0]}.`);
    } else {
      setStatusMessage("Passkey authentication failed. Retry when ready.");
    }
  }, [handleLogin]);

  const onDeposit = useCallback(async () => {
    if (!employee || depositing) return;
    setDepositing(true);
    setStatusMessage("Submitting payroll funding...");
    const cleanAmount = depositAmount.replace(/[^0-9.]/g, "") || "50000";
    const prettyAmount = Number(cleanAmount).toLocaleString("en-US");
    try {
      const result = await depositPayroll(prettyAmount);
      const nextStatus: TxStatus = result.status === "failed" ? "failed" : "pending";
      const nextTx: QueuedTx = {
        txHash: result.txHash, status: nextStatus, kind: "deposit",
        amount: `$${prettyAmount}`, startedAt: Date.now(),
      };
      queueTransaction(nextTx);
      await reloadActivity();
      if (result.status === "failed") {
        addNotification("Payroll funding failed to submit.", "error");
        setStatusMessage("Payroll funding error. Retry from Flows.");
      } else {
        addNotification("Payroll funding is in motion.", "info");
        setStatusMessage("Payroll submitted. Confirming...");
        setReceipt({ type: "deposit", amount: prettyAmount, txHash: result.txHash });
        navigate("flows");
      }
    } catch {
      addNotification("Unable to submit payroll.", "error");
      setStatusMessage("Payroll submission failed. Retry from Flows.");
    } finally {
      setDepositing(false);
    }
  }, [
    employee,
    depositing,
    depositAmount,
    queueTransaction,
    addNotification,
    reloadActivity,
    navigate,
  ]);

  const onWithdraw = useCallback(async () => {
    if (!employee || withdrawing || !balance) return;
    setWithdrawing(true);
    setStatusMessage("Requesting withdrawal...");
    try {
      const result = await withdraw(employee.employeeId);
      const nextStatus: TxStatus = result.status === "failed" ? "failed" : "pending";
      const nextTx: QueuedTx = {
        txHash: result.txHash, status: nextStatus, kind: "withdraw",
        amount: `$${Number(result.amountReceived).toFixed(2)}`, startedAt: Date.now(),
      };
      queueTransaction(nextTx);
      await reloadActivity();
      if (result.status === "failed") {
        addNotification("Withdrawal failed to submit.", "error");
        setStatusMessage("Withdrawal error. Retry when ready.");
      } else {
        addNotification("Withdrawal request queued.", "info");
        setStatusMessage("Withdrawal submitted. Awaiting final settlement.");
        setReceipt({
          type: "withdraw",
          amount: result.amountReceived,
          txHash: result.txHash,
        });
        navigate("activity");
      }
    } catch {
      addNotification("Unable to withdraw right now.", "error");
      setStatusMessage("Withdrawal failed. Retry when ready.");
    } finally {
      setWithdrawing(false);
    }
  }, [
    employee,
    withdrawing,
    balance,
    queueTransaction,
    addNotification,
    reloadActivity,
    navigate,
  ]);

  const requestDeposit = useCallback(() => {
    if (!employee || depositing) return;
    const clean = depositAmount.replace(/[^0-9.]/g, "") || "50000";
    setPendingConfirm({ type: "deposit", amount: Number(clean).toLocaleString("en-US") });
  }, [employee, depositing, depositAmount]);

  const requestWithdraw = useCallback(() => {
    if (!employee || withdrawing || !balance) return;
    setPendingConfirm({ type: "withdraw", amount: balance.unlockedAmount });
  }, [employee, withdrawing, balance]);

  const executeConfirm = useCallback(() => {
    if (!pendingConfirm) return;
    const action = pendingConfirm.type;
    setPendingConfirm(null);
    if (action === "deposit") void onDeposit();
    else void onWithdraw();
  }, [pendingConfirm, onDeposit, onWithdraw]);

  const onResetDemo = useCallback(async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetDemo();
      clearSession();
      setStats(await getEmployerStats());
      setActivity(await getActivity());
      await initEmployer();
      setDepositAmount("50000");
      setPendingConfirm(null);
      setReceipt(null);
      setStatusMessage("Demo reset. Ready to flow capital.");
      addNotification("Demo state cleared.", "success");
      setSettingsOpen(false);
      navigate("dashboard");
    } catch (error) {
      console.error(error);
      addNotification("Unable to reset demo.", "error");
    } finally {
      setResetting(false);
    }
  }, [
    resetting,
    clearSession,
    setStats,
    setActivity,
    initEmployer,
    addNotification,
    navigate,
  ]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="background-lines" aria-hidden="true">
        <div className="line line-one" />
        <div className="line line-two" />
        <div className="line line-three" />
      </div>

      <section className="top-shell">
        <button className="brand-mark" type="button" onClick={() => navigate("dashboard")}>
          <span className="brand-glyph">YF</span>
          YieldFlow
        </button>

        <div className="pill-nav" role="tablist" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={page === item.id}
              onClick={(event) => { ripple(event); navigate(item.id); }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="top-shell-actions">
          <div className="status-pill" role="status" aria-live="polite">
            <span className="status-dot" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            className="icon-nav-btn"
            aria-label="Open demo settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={16} />
          </button>
        </div>
      </section>

      <main className="main-canvas" id="main" ref={mainRef} tabIndex={-1}>
        <section className="screen-section compact-screen hero-block">
          <span className="eyebrow">{pageCopy[page].eyebrow}</span>
          <h1>{pageCopy[page].title}</h1>
          <p>{pageCopy[page].body}</p>
          <div className="context-chips">
            <span className="context-chip">{networkLabel}</span>
            <span className="context-chip">USDC</span>
            <span className="context-chip">SDK · {sdkMeta.mode}</span>
            <span className="context-chip">Biweekly · {displayStats.activeEmployees} staff</span>
            {employee && <span className="context-chip live-chip">Session active</span>}
          </div>
        </section>

        {!booting && page === "dashboard" && (
          <HealthStrip
            employee={employee}
            stats={stats}
            transactionQueue={transactionQueue}
            sdkMode={sdkMeta.mode}
            networkLabel={networkLabel}
          />
        )}

        {booting ? (
          <section className="dashboard-grid" aria-busy="true" aria-label="Loading dashboard">
            {[1, 2, 3, 4].map((n) => (
              <article key={n} className="metric-card skeleton-card">
                <div className="metric-top"><span>Loading</span></div>
                <strong>--</strong>
                <small>Fetching SDK state</small>
              </article>
            ))}
          </section>
        ) : null}

        {!booting && page === "dashboard" && (
          <Dashboard
            employer={employer}
            employee={employee}
            balance={balance}
            displayStats={displayStats}
            liveBalance={liveBalance}
            streamProgress={streamProgress}
            activity={activity}
            authenticating={authenticating}
            withdrawing={withdrawing}
            expandedActivityId={expandedActivityId}
            onToggleExpand={setExpandedActivityId}
            onLogin={onLogin}
            onWithdraw={requestWithdraw}
            onNavigate={navigate}
          />
        )}

        {!booting && page === "flows" && (
          <Flows
            employer={employer}
            employee={employee}
            balance={balance}
            displayStats={displayStats}
            liveBalance={liveBalance}
            streamProgress={streamProgress}
            activeTx={activeTx}
            transactionQueue={transactionQueue}
            stats={stats}
            depositing={depositing}
            withdrawing={withdrawing}
            depositAmount={depositAmount}
            onDepositAmountChange={setDepositAmount}
            onDeposit={requestDeposit}
            onWithdraw={requestWithdraw}
            onNavigate={navigate}
          />
        )}

        {!booting && page === "activity" && (
          <ActivityPage
            filteredActivity={filteredActivity}
            activityFilter={activityFilter}
            statusFilter={statusFilter}
            searchQuery={searchQuery}
            transactionQueue={transactionQueue}
            expandedActivityId={expandedActivityId}
            detailItem={detailItem}
            onToggleExpand={setExpandedActivityId}
            onFilterChange={setActivityFilter}
            onStatusFilterChange={setStatusFilter}
            onSearchChange={setSearchQuery}
            onOpenDetail={setDetailItem}
            onExportCsv={exportCsv}
            onNavigate={navigate}
          />
        )}
      </main>

      {pendingConfirm && (
        <ConfirmDialog
          type={pendingConfirm.type}
          amount={pendingConfirm.amount}
          displayStats={displayStats}
          onConfirm={executeConfirm}
          onCancel={() => setPendingConfirm(null)}
        />
      )}

      {receipt && (
        <ReceiptDialog
          receipt={receipt}
          displayStats={displayStats}
          onClose={() => setReceipt(null)}
          onOpenActivity={() => navigate("activity")}
        />
      )}

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sdkMode={sdkMeta.mode}
        networkLabel={networkLabel}
        resetting={resetting}
        onResetDemo={() => void onResetDemo()}
      />

      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
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
