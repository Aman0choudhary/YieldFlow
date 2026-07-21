import type {
  ActivityFilterInput,
  ActivityItem,
  DepositPayrollResult,
  DepositPreview,
  EmployeeBalance,
  EmployeeSession,
  EmployerConnection,
  EmployerStats,
  FlowNode,
  StreamPhysics,
  TransactionDetail,
  TxStatus,
  WithdrawResult,
} from "./types";
import type { SdkMeta } from "./config";
import { TESTNET_CONFIG } from "./config";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const STORAGE_KEYS = {
  employeeId: "yieldflow.employeeId",
  depositCount: "yieldflow.depositCount",
  activity: "yieldflow.activityLog",
  pool: "yieldflow.totalPool",
};

const txStatuses = new Map<string, TxStatus>();
const txMeta = new Map<
  string,
  { kind: "deposit" | "withdraw"; amount: string; startedAt: number }
>();

let employeeStartedAt = Date.now() - 1000 * 60 * 60 * 18;
let employeeBaseUnlocked = 1245.6793;
const ratePerSecond = 0.00015;
const streamCap = 5000;
const bufferPercent = 15;
const yieldRoutePercent = 85;
const baseApy = 4.2;
const basePool = 245000;

const seedActivity = (): ActivityItem[] => [
  {
    id: "act_1",
    kind: "deposit",
    label: "Payroll deposit",
    timestamp: "Today, 09:41",
    amount: "+50,000 USDC",
    status: "confirmed",
    txHash: "0xseeddeposit0001",
    counterparty: "Employer treasury",
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: "act_2",
    kind: "stream",
    label: "Employee streams settled",
    timestamp: "Today, 00:00",
    amount: "-1,250 USDC",
    status: "confirmed",
    counterparty: "12 employees",
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: "act_3",
    kind: "yield",
    label: "Yield harvested",
    timestamp: "Yesterday",
    amount: "+42.50 USDC",
    status: "confirmed",
    counterparty: "Yield vault",
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: "act_4",
    kind: "auth",
    label: "Passkey session restored",
    timestamp: "Yesterday",
    amount: "Employee",
    status: "confirmed",
    counterparty: "Aditiya Sharma",
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
  },
];

const makeTxHash = () => {
  const chunk = () => Math.random().toString(16).slice(2, 10);
  return `0x${chunk()}${chunk()}${chunk()}`;
};

const maybeFail = (chance = 0.08) => Math.random() < chance;

const formatTs = (date = new Date()) => {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `Today, ${h}:${m}`;
};

const readDepositCount = () => {
  const raw = window.localStorage.getItem(STORAGE_KEYS.depositCount);
  return raw ? Number(raw) || 0 : 0;
};

const writeDepositCount = (n: number) => {
  window.localStorage.setItem(STORAGE_KEYS.depositCount, String(n));
};

const readPool = () => {
  const raw = window.localStorage.getItem(STORAGE_KEYS.pool);
  return raw ? Number(raw) || basePool : basePool;
};

const writePool = (n: number) => {
  window.localStorage.setItem(STORAGE_KEYS.pool, n.toFixed(2));
};

const loadActivity = (): ActivityItem[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.activity);
    if (!raw) {
      const seed = seedActivity();
      window.localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as ActivityItem[];
  } catch {
    return seedActivity();
  }
};

const saveActivity = (items: ActivityItem[]) => {
  window.localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(items.slice(0, 80)));
};

const pushActivityItem = (item: ActivityItem) => {
  const current = loadActivity();
  const next = [item, ...current.filter((row) => row.id !== item.id)].slice(0, 80);
  saveActivity(next);
  return next;
};

const projectedApyForCount = (depositCount: number) =>
  Math.max(1.5, baseApy * (1 - 0.002 * depositCount)).toFixed(2);

const explorerUrlFor = (txHash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${encodeURIComponent(txHash)}`;

export async function connectEmployer(): Promise<EmployerConnection> {
  await delay(500);
  return { address: "GBYF...EMPLOYER...P4Y" };
}

export async function depositPayroll(amount: string): Promise<DepositPayrollResult> {
  await delay(650);
  const txHash = makeTxHash();
  const status: DepositPayrollResult["status"] = maybeFail(0.05) ? "failed" : "submitted";
  const numeric = Number(String(amount).replace(/[^0-9.]/g, "")) || 0;
  const pretty = numeric.toLocaleString("en-US");

  txStatuses.set(txHash, status === "failed" ? "failed" : "pending");
  txMeta.set(txHash, {
    kind: "deposit",
    amount: `+${pretty} USDC`,
    startedAt: Date.now(),
  });

  pushActivityItem({
    id: `deposit-${txHash}`,
    kind: "deposit",
    label: "Payroll deposit",
    timestamp: formatTs(),
    amount: `+${pretty} USDC`,
    status: status === "failed" ? "failed" : "pending",
    txHash,
    counterparty: "Employer treasury",
    createdAt: Date.now(),
  });

  if (status !== "failed") {
    const count = readDepositCount() + 1;
    writeDepositCount(count);
    writePool(readPool() + numeric);
    void delay(2200).then(() => {
      if (txStatuses.get(txHash) === "pending") {
        txStatuses.set(txHash, "confirmed");
        const items = loadActivity().map((row) =>
          row.txHash === txHash ? { ...row, status: "confirmed" as TxStatus } : row,
        );
        saveActivity(items);
      }
    });
  }

  console.info(`Mock deposit payroll: ${amount} USDC`);
  return { txHash, status };
}

export async function getEmployerStats(): Promise<EmployerStats> {
  await delay(350);
  const pool = readPool();
  const depositCount = readDepositCount();
  return {
    totalPool: pool.toFixed(2),
    yieldEarned: "1240.50",
    bufferAmount: ((pool * bufferPercent) / 100).toFixed(2),
    bufferPercent,
    yieldRoutePercent,
    activeEmployees: 12,
    projectedApy: projectedApyForCount(depositCount),
  };
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  await delay(300);
  return { employeeId: window.localStorage.getItem(STORAGE_KEYS.employeeId) };
}

export async function loginEmployee(): Promise<EmployeeSession> {
  await delay(900);
  if (maybeFail(0.05)) throw new Error("Passkey prompt was cancelled. Try again when ready.");
  const session = {
    employeeId: "emp_aditiya_001",
    name: "Aditiya Sharma",
    walletAddress: "CCONTRACT...PASSKEY...YF01",
  };
  window.localStorage.setItem(STORAGE_KEYS.employeeId, session.employeeId);
  pushActivityItem({
    id: `auth-${Date.now()}`,
    kind: "auth",
    label: "Passkey session restored",
    timestamp: formatTs(),
    amount: "Employee",
    status: "confirmed",
    counterparty: session.name,
    createdAt: Date.now(),
  });
  return session;
}

export async function getEmployeeBalance(employeeId: string): Promise<EmployeeBalance> {
  await delay(250);
  const elapsed = Math.max(0, (Date.now() - employeeStartedAt) / 1000);
  const unlocked = Math.min(streamCap, employeeBaseUnlocked + elapsed * ratePerSecond);
  console.info(`Mock balance request for ${employeeId}`);
  return {
    unlockedAmount: unlocked.toFixed(7),
    ratePerSecond: ratePerSecond.toFixed(7),
    totalStreamed: "3920.4000000",
    streamCap: streamCap.toFixed(7),
    nextPayday: "14 days",
  };
}

export async function withdraw(employeeId: string): Promise<WithdrawResult> {
  await delay(550);
  const current = await getEmployeeBalance(employeeId);
  const txHash = makeTxHash();
  const status: WithdrawResult["status"] = maybeFail(0.08) ? "failed" : "submitted";
  const received = Number(current.unlockedAmount);

  txStatuses.set(txHash, status === "failed" ? "failed" : "pending");
  txMeta.set(txHash, {
    kind: "withdraw",
    amount: `-${received.toFixed(2)} USDC`,
    startedAt: Date.now(),
  });

  pushActivityItem({
    id: `withdraw-${txHash}`,
    kind: "withdraw",
    label: "Payout withdrawal",
    timestamp: formatTs(),
    amount: `-${received.toFixed(2)} USDC`,
    status: status === "failed" ? "failed" : "pending",
    txHash,
    counterparty: "Employee wallet",
    createdAt: Date.now(),
  });

  if (status !== "failed") {
    employeeBaseUnlocked = Math.max(0, employeeBaseUnlocked - received * 0.15);
    employeeStartedAt = Date.now() - 1000 * 60 * 30;
    void delay(2400).then(() => {
      if (txStatuses.get(txHash) === "pending") {
        txStatuses.set(txHash, "confirmed");
        const items = loadActivity().map((row) =>
          row.txHash === txHash ? { ...row, status: "confirmed" as TxStatus } : row,
        );
        saveActivity(items);
      }
    });
  }

  return { txHash, status, amountReceived: current.unlockedAmount };
}

export async function getTransactionStatus(txHash: string): Promise<TxStatus> {
  await delay(250);
  return txStatuses.get(txHash) ?? "confirmed";
}

export async function getActivity(filter?: ActivityFilterInput): Promise<ActivityItem[]> {
  await delay(250);
  let items = loadActivity();

  if (filter?.kind && filter.kind !== "all") {
    items = items.filter((item) => item.kind === filter.kind);
  }
  if (filter?.status && filter.status !== "all") {
    items = items.filter((item) => (item.status ?? "confirmed") === filter.status);
  }
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    items = items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.amount.toLowerCase().includes(q) ||
        (item.txHash ?? "").toLowerCase().includes(q) ||
        (item.counterparty ?? "").toLowerCase().includes(q),
    );
  }
  if (filter?.from) {
    const from = Date.parse(filter.from);
    if (!Number.isNaN(from)) {
      items = items.filter((item) => (item.createdAt ?? 0) >= from);
    }
  }
  if (filter?.to) {
    const to = Date.parse(filter.to);
    if (!Number.isNaN(to)) {
      items = items.filter((item) => (item.createdAt ?? 0) <= to);
    }
  }

  return items;
}

export async function previewDeposit(amount: string): Promise<DepositPreview> {
  await delay(120);
  const numeric = Number(String(amount).replace(/[^0-9.]/g, "")) || 0;
  const depositCount = readDepositCount();
  const bufferShare = numeric * (bufferPercent / 100);
  const yieldShare = numeric * (yieldRoutePercent / 100);
  return {
    bufferShare: bufferShare.toFixed(2),
    yieldShare: yieldShare.toFixed(2),
    projectedApy: projectedApyForCount(depositCount + (numeric > 0 ? 1 : 0)),
    bufferPercent,
    yieldRoutePercent,
  };
}

export async function getStreamPhysics(employeeId: string): Promise<StreamPhysics> {
  await delay(180);
  const balance = await getEmployeeBalance(employeeId);
  const unlocked = Number(balance.unlockedAmount);
  const cap = Number(balance.streamCap);
  const locked = Math.max(0, cap - unlocked);
  const secondsToPayday = 14 * 24 * 60 * 60;
  const bufferCoverageHours = unlocked > 0 ? unlocked / (ratePerSecond * 3600) : 0;
  return {
    unlockedAmount: unlocked.toFixed(7),
    lockedAmount: locked.toFixed(7),
    ratePerSecond: balance.ratePerSecond,
    secondsToPayday,
    bufferCoverageHours: Number(bufferCoverageHours.toFixed(1)),
    streamCap: balance.streamCap,
    totalStreamed: balance.totalStreamed,
    unlockedPercent: cap > 0 ? Math.min(100, (unlocked / cap) * 100) : 0,
  };
}

export async function getFlowGraph(): Promise<FlowNode[]> {
  await delay(100);
  const hasSession = Boolean(window.localStorage.getItem(STORAGE_KEYS.employeeId));
  return [
    { id: "employer", label: "Employer pool", detail: "Treasury deposit source", active: true },
    { id: "vault", label: "Yield vault", detail: `${yieldRoutePercent}% routed`, active: true },
    { id: "buffer", label: "Instant buffer", detail: `${bufferPercent}% liquid`, active: true },
    { id: "stream", label: "Stream engine", detail: "Continuous wage unlock", active: hasSession },
    { id: "wallet", label: "Employee wallet", detail: "Passkey settlement", active: hasSession },
  ];
}

export async function getTransactionDetail(txHash: string): Promise<TransactionDetail> {
  await delay(200);
  const status = txStatuses.get(txHash) ?? "confirmed";
  const meta = txMeta.get(txHash);
  const kind = meta?.kind ?? "deposit";
  const amount = meta?.amount ?? "—";
  const startedAt = meta?.startedAt ?? Date.now() - 3000;
  const step = (label: string, offsetMs: number, stepStatus: TxStatus): TransactionDetail["steps"][number] => ({
    label,
    at: new Date(startedAt + offsetMs).toLocaleTimeString(),
    status: stepStatus,
  });

  const steps =
    status === "failed"
      ? [
          step("Building", 0, "confirmed"),
          step("Submitted", 400, "confirmed"),
          step("Failed", 900, "failed"),
        ]
      : status === "confirmed"
        ? [
            step("Building", 0, "confirmed"),
            step("Submitted", 400, "confirmed"),
            step("Pending hop 2/4", 900, "confirmed"),
            step("Confirmed", 2200, "confirmed"),
          ]
        : [
            step("Building", 0, "confirmed"),
            step("Submitted", 400, "confirmed"),
            step("Pending hop 2/4", 900, "pending"),
            step("Confirmed", 2200, "idle"),
          ];

  return {
    status,
    steps,
    amount,
    kind,
    txHash,
    explorerUrl: explorerUrlFor(txHash),
  };
}

/** Demo reset: clear local mock state and reseed activity. */
export async function resetDemo(): Promise<void> {
  await delay(80);
  window.localStorage.removeItem(STORAGE_KEYS.employeeId);
  window.localStorage.removeItem(STORAGE_KEYS.depositCount);
  window.localStorage.removeItem(STORAGE_KEYS.pool);
  window.localStorage.removeItem(STORAGE_KEYS.activity);
  txStatuses.clear();
  txMeta.clear();
  employeeStartedAt = Date.now() - 1000 * 60 * 60 * 18;
  employeeBaseUnlocked = 1245.6793;
  saveActivity(seedActivity());
}

export function getSdkMeta(): SdkMeta {
  return {
    mode: "mock",
    network: "mock-local",
    ready: true,
    contracts: TESTNET_CONFIG.contracts,
  };
}

export async function getSdkInfo(): Promise<SdkMeta> {
  return getSdkMeta();
}
