import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Fingerprint,
  Gauge,
  Landmark,
  Loader2,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  WalletCards,
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
  type ActivityItem,
  type EmployeeBalance,
  type EmployeeSession,
  type EmployerStats,
  type TxStatus,
} from "./sdk/yieldflow-sdk";

type View = "employer" | "employee" | "activity" | "settings";

type TxViewState = {
  status: TxStatus;
  txHash?: string;
  message: string;
};

const initialTx: TxViewState = { status: "idle", message: "Ready" };

const formatUsdc = (value: string, digits = 2) =>
  `${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} USDC`;

const shortHash = (hash?: string) => (hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : "--");

function App() {
  const [view, setView] = useState<View>("employer");
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    void getActivity().then(setActivity);
  }, []);

  return (
    <div className="app-shell">
      <BackgroundLines />
      <TopNav view={view} onViewChange={setView} />
      <main className="main-canvas">
        {view === "employer" && <EmployerDashboard activity={activity} />}
        {view === "employee" && <EmployeeDashboard activity={activity} />}
        {view === "activity" && <ActivityView activity={activity} />}
        {view === "settings" && <SettingsView />}
      </main>
    </div>
  );
}

function BackgroundLines() {
  return (
    <div className="background-lines" aria-hidden="true">
      <div className="line line-one" />
      <div className="line line-two" />
      <div className="line line-three" />
    </div>
  );
}

function TopNav({ view, onViewChange }: { view: View; onViewChange: (view: View) => void }) {
  const items: View[] = ["employer", "employee", "activity", "settings"];
  return (
    <header className="top-shell">
      <button className="brand-mark" onClick={() => onViewChange("employer")}>
        <span className="brand-glyph">YF</span>
        <span>YieldFlow</span>
      </button>
      <nav className="pill-nav" aria-label="Primary navigation">
        {items.map((item) => (
          <button
            key={item}
            className={view === item ? "nav-item active" : "nav-item"}
            onClick={() => onViewChange(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="status-pill">
        <span className="status-dot" /> Mock SDK · Stellar Testnet
      </div>
    </header>
  );
}

function EmployerDashboard({ activity }: { activity: ActivityItem[] }) {
  const [stats, setStats] = useState<EmployerStats | null>(null);
  const [address, setAddress] = useState<string>("");
  const [tx, setTx] = useState<TxViewState>(initialTx);
  const busy = ["authenticating", "building", "submitted", "pending"].includes(tx.status);

  useEffect(() => {
    void connectEmployer().then((result) => setAddress(result.address));
    void getEmployerStats().then(setStats);
  }, []);

  async function handleDeposit() {
    if (busy) return;
    setTx({ status: "building", message: "Preparing testnet payroll deposit" });
    const result = await depositPayroll("50000.00");
    if (result.status === "failed") {
      setTx({ status: "failed", txHash: result.txHash, message: "Mock deposit failed" });
      return;
    }
    setTx({ status: "pending", txHash: result.txHash, message: "Submitted. Waiting for confirmation" });
    pollTx(result.txHash, setTx);
  }

  const chartBars = [36, 44, 42, 52, 61, 58, 72, 76, 86, 92, 88, 96];

  return (
    <section className="screen-section">
      <Hero
        eyebrow="Gasless Payroll Streaming"
        title={<>Payroll That <span>Streams</span>. Yield That <span>Works</span>.</>}
        copy="A demo-ready treasury surface for monthly USDC payroll, instant liquidity, and continuously unlocking salary streams."
      />

      <div className="dashboard-grid employer-grid">
        <MetricCard icon={<Landmark />} label="Total Payroll Pool" value={stats ? formatUsdc(stats.totalPool, 2) : "Loading"} />
        <MetricCard icon={<TrendingUp />} label="Yield Earned" value={stats ? `+${formatUsdc(stats.yieldEarned, 2)}` : "Loading"} tone="accent" sub={`${stats?.projectedApy ?? "--"}% projected APY`} />
        <MetricCard icon={<Gauge />} label="Liquidity Buffer" value={stats ? formatUsdc(stats.bufferAmount, 2) : "Loading"} sub="Healthy · 15% reserve" />
        <MetricCard icon={<UsersRound />} label="Active Employees" value={stats ? String(stats.activeEmployees) : "--"} sub="Streaming live" />

        <Panel className="allocation-panel">
          <div className="panel-header">
            <div>
              <p className="label">Treasury Allocation</p>
              <h2>Vault split</h2>
            </div>
            <span className="chip">USDC SAC ready</span>
          </div>
          <div className="allocation-bar" aria-label="85 percent yield route, 15 percent buffer">
            <span style={{ width: `${stats?.yieldRoutePercent ?? 85}%` }} />
          </div>
          <div className="allocation-legend">
            <span><i className="berry" />85% Yield Route</span>
            <span><i className="cream" />15% Liquidity Buffer</span>
          </div>
          <button className="primary-btn" onClick={handleDeposit} disabled={busy}>
            {busy ? <Loader2 className="spin" /> : <CircleDollarSign />} Deposit Payroll
          </button>
          <TransactionStatus tx={tx} />
        </Panel>

        <Panel className="flow-panel browser-frame">
          <div className="browser-top">
            <span /><span /><span />
            <p>Payroll Flow Visualization</p>
          </div>
          <div className="flow-map">
            <FlowNode icon={<BriefcaseBusiness />} label="Employer Deposit" />
            <ArrowRight className="flow-arrow" />
            <FlowNode icon={<WalletCards />} label="Vault" />
            <ArrowRight className="flow-arrow" />
            <FlowNode icon={<TrendingUp />} label="DeFindex / Blend" active />
            <ArrowRight className="flow-arrow" />
            <FlowNode icon={<ShieldCheck />} label="Liquidity Buffer" />
            <ArrowRight className="flow-arrow" />
            <FlowNode icon={<Send />} label="Employee Stream" />
          </div>
        </Panel>

        <Panel className="chart-panel">
          <div className="panel-header">
            <div>
              <p className="label">Yield Earned</p>
              <h2>30 day curve</h2>
            </div>
            <span className="chip">Mock data</span>
          </div>
          <div className="yield-chart">
            {chartBars.map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}
          </div>
        </Panel>

        <ActivityFeed activity={activity} address={address} />
      </div>
    </section>
  );
}

function EmployeeDashboard({ activity }: { activity: ActivityItem[] }) {
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [balance, setBalance] = useState<EmployeeBalance | null>(null);
  const [displayBalance, setDisplayBalance] = useState("0.0000000");
  const [authError, setAuthError] = useState("");
  const [tx, setTx] = useState<TxViewState>(initialTx);
  const busy = ["authenticating", "building", "submitted", "pending"].includes(tx.status);

  useEffect(() => {
    void restoreEmployeeSession().then(async (result) => {
      if (!result.employeeId) return;
      const restored = { employeeId: result.employeeId, name: "Aditiya Sharma", walletAddress: "CCONTRACT...PASSKEY...YF01" };
      setSession(restored);
      setBalance(await getEmployeeBalance(restored.employeeId));
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const refresh = async () => {
      const next = await getEmployeeBalance(session.employeeId);
      if (!cancelled) setBalance(next);
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!balance) return;
    let current = Number(balance.unlockedAmount);
    setDisplayBalance(current.toFixed(7));
    const rate = Number(balance.ratePerSecond);
    const timer = window.setInterval(() => {
      current += rate;
      setDisplayBalance(current.toFixed(7));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [balance]);

  async function handleLogin() {
    setAuthError("");
    setTx({ status: "authenticating", message: "Waiting for passkey prompt" });
    try {
      const nextSession = await loginEmployee();
      setSession(nextSession);
      setBalance(await getEmployeeBalance(nextSession.employeeId));
      setTx({ status: "confirmed", message: "Passkey session active" });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to login");
      setTx({ status: "failed", message: "Passkey login failed" });
    }
  }

  async function handleWithdraw() {
    if (!session || busy) return;
    setTx({ status: "authenticating", message: "Authorizing gasless withdrawal" });
    await wait(450);
    setTx({ status: "building", message: "Building withdrawal call" });
    const result = await withdraw(session.employeeId);
    if (result.status === "failed") {
      setTx({ status: "failed", txHash: result.txHash, message: "Withdrawal failed in mock relayer" });
      return;
    }
    setTx({ status: "pending", txHash: result.txHash, message: `Submitted ${formatUsdc(result.amountReceived, 4)}` });
    pollTx(result.txHash, setTx);
  }

  const progress = useMemo(() => {
    if (!balance) return 0;
    return Math.min(100, (Number(displayBalance) / Number(balance.streamCap)) * 100);
  }, [balance, displayBalance]);

  return (
    <section className="screen-section">
      <Hero
        eyebrow="Passkey Secured · Zero Seed Phrases"
        title={<>Your Salary, <span>Unlocking Live</span>.</>}
        copy="Track the amount you can withdraw right now, authenticate with a passkey, and receive test USDC without touching network fees."
      />

      <div className="dashboard-grid employee-grid">
        <Panel className="live-balance-panel">
          <div className="panel-header">
            <div>
              <p className="label">Live Balance</p>
              <h2>Available salary</h2>
            </div>
            <span className="chip">{session ? "Passkey active" : "Login required"}</span>
          </div>
          <div className="live-amount">{Number(displayBalance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 7 })}<small>USDC</small></div>
          <div className="stream-progress">
            <div className="stream-progress-top"><span>Streaming progress</span><span>{progress.toFixed(1)}%</span></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
        </Panel>

        <div className="mini-grid">
          <MetricCard icon={<Banknote />} label="Available Now" value={balance ? formatUsdc(displayBalance, 4) : "--"} tone="accent" />
          <MetricCard icon={<RefreshCw />} label="Rate / sec" value={balance ? `+${balance.ratePerSecond}` : "--"} sub="USDC" />
          <MetricCard icon={<Clock3 />} label="Next Payday" value={balance?.nextPayday ?? "--"} />
          <MetricCard icon={<LockKeyhole />} label="Wallet Session" value={session ? "Active" : "Locked"} sub={session?.walletAddress ?? "Passkey required"} />
        </div>

        <Panel className="passkey-panel">
          <div className="passkey-icon"><Fingerprint /></div>
          <div>
            <p className="label">Employee Access</p>
            <h2>{session ? session.name : "Passkey login"}</h2>
            <p className="muted">{session ? session.walletAddress : "Authenticate once and restore your smart account session silently later."}</p>
          </div>
          {authError && <p className="error-text">{authError}</p>}
          <button className="secondary-btn" onClick={handleLogin} disabled={busy}>{session ? "Refresh Session" : "Login With Passkey"}</button>
        </Panel>

        <Panel className="withdraw-panel">
          <button className="primary-btn" onClick={handleWithdraw} disabled={!session || busy}>
            {busy ? <Loader2 className="spin" /> : <WalletCards />} Withdraw Funds
          </button>
          <TransactionStatus tx={tx} />
        </Panel>

        <ActivityFeed activity={activity.filter((item) => item.kind !== "deposit")} />
      </div>
    </section>
  );
}

function Hero({ eyebrow, title, copy }: { eyebrow: string; title: React.ReactNode; copy: string }) {
  return (
    <header className="hero-block">
      <div className="eyebrow"><BadgeCheck /> {eyebrow}</div>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

function MetricCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: "accent" }) {
  return (
    <article className={tone === "accent" ? "metric-card accent" : "metric-card"}>
      <div className="metric-top"><span>{label}</span>{icon}</div>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`glass-panel ${className}`}>{children}</section>;
}

function FlowNode({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={active ? "flow-node active" : "flow-node"}>
      <div>{icon}</div>
      <span>{label}</span>
    </div>
  );
}

function ActivityFeed({ activity, address }: { activity: ActivityItem[]; address?: string }) {
  const iconMap = {
    deposit: <CircleDollarSign />,
    stream: <Activity />,
    yield: <TrendingUp />,
    withdraw: <ReceiptText />,
    auth: <Fingerprint />,
  };
  return (
    <Panel className="activity-panel">
      <div className="panel-header">
        <div>
          <p className="label">Recent Activity</p>
          <h2>Ledger view</h2>
        </div>
      </div>
      {address && <p className="muted wallet-line">{address}</p>}
      <div className="activity-list">
        {activity.map((item) => (
          <div className="activity-row" key={item.id}>
            <span className="activity-icon">{iconMap[item.kind]}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.timestamp}</small>
            </div>
            <span className="activity-amount">{item.amount}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TransactionStatus({ tx }: { tx: TxViewState }) {
  const steps: TxStatus[] = ["idle", "authenticating", "building", "submitted", "pending", "confirmed"];
  return (
    <div className="tx-status">
      <div className="tx-header"><span>Transaction Status</span><strong>{tx.status}</strong></div>
      <p>{tx.message}</p>
      <div className="tx-steps">
        {steps.map((step) => (
          <span key={step} className={step === tx.status ? "current" : steps.indexOf(step) < steps.indexOf(tx.status) ? "done" : ""}>
            {step === tx.status && ["authenticating", "building", "submitted", "pending"].includes(step) ? <Loader2 className="spin" /> : <CheckCircle2 />}
            {step}
          </span>
        ))}
      </div>
      {tx.txHash && <div className="tx-hash"><span>Tx hash</span><code>{shortHash(tx.txHash)}</code></div>}
    </div>
  );
}

function ActivityView({ activity }: { activity: ActivityItem[] }) {
  return (
    <section className="screen-section compact-screen">
      <Hero eyebrow="Operational Timeline" title={<>Every Flow, <span>Traceable</span>.</>} copy="A shared activity surface for deposits, stream settlement, passkey access, and withdrawals." />
      <ActivityFeed activity={activity} />
    </section>
  );
}

function SettingsView() {
  return (
    <section className="screen-section compact-screen">
      <Hero eyebrow="Demo Configuration" title={<>SDK Boundary, <span>Locked</span>.</>} copy="These controls document the assumptions the frontend is built against while the Stellar integration matures." />
      <Panel className="settings-panel">
        <div className="setting-row"><span>Network</span><strong>Stellar Testnet</strong></div>
        <div className="setting-row"><span>Asset</span><strong>USDC via SAC</strong></div>
        <div className="setting-row"><span>Frontend mode</span><strong>Mock SDK only</strong></div>
        <div className="setting-row"><span>Passkey provider</span><strong>SDK wrapped</strong></div>
        <div className="setting-row"><span>Relayer</span><strong>SDK wrapped</strong></div>
      </Panel>
    </section>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function pollTx(txHash: string, setTx: (tx: TxViewState) => void) {
  setTx({ status: "pending", txHash, message: "Waiting for Stellar testnet confirmation" });
  for (let i = 0; i < 8; i += 1) {
    const status = await getTransactionStatus(txHash);
    if (status === "confirmed" || status === "failed") {
      setTx({ status, txHash, message: status === "confirmed" ? "Confirmed in mock ledger" : "Transaction failed" });
      return;
    }
    await wait(700);
  }
  setTx({ status: "failed", txHash, message: "Confirmation timed out" });
}

export default App;
