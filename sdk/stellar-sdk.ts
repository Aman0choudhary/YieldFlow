/**
 * Phase 3 Stellar surface for the Vite UI (string-amount domain model).
 *
 * Same exports as mock-sdk.ts. Contract IDs via sdk/config.ts / VITE_* env.
 * Live generated-client bridge lives in yieldflow-sdk.chain.js (Aman path);
 * wire it after deploy + wallet signer. Until then methods provide safe
 * local stellar-mode behavior for activity/preview when configured, else throw.
 */

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
import {
  TESTNET_CONFIG,
  contractsReady,
  type SdkMeta,
  type YieldFlowNetworkConfig,
} from "./config";

const config: YieldFlowNetworkConfig = TESTNET_CONFIG;
const bufferPercent = 15;
const yieldRoutePercent = 85;

const ACTIVITY_KEY = "yieldflow.stellar.activityLog";
const SESSION_KEY = "yieldflow.stellar.employeeId";
const txStatuses = new Map<string, TxStatus>();
const txMeta = new Map<string, { kind: "deposit" | "withdraw"; amount: string; startedAt: number }>();

export function getSdkMeta(): SdkMeta {
  const ready = contractsReady(config);
  return {
    mode: "stellar",
    network: config.network,
    ready,
    reason: ready
      ? "Contract IDs present. Wire wallet signer + yieldflow-sdk.chain.js for live RPC writes."
      : "Set VITE_VAULT_CONTRACT_ID + VITE_STREAMING_CONTRACT_ID (or sdk/config.ts), deploy, rebuild.",
    contracts: config.contracts,
  };
}

function notReady(name: string): never {
  const meta = getSdkMeta();
  throw new Error(
    `stellar-sdk.${name}: ${meta.reason ?? "Stellar path not ready."} Use VITE_YIELDFLOW_SDK=mock for demos.`,
  );
}

export function isStellarConfigured(): boolean {
  return contractsReady(config);
}

const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const makeTxHash = () => {
  const chunk = () => Math.random().toString(16).slice(2, 10);
  return `0x${chunk()}${chunk()}${chunk()}`;
};
const formatTs = (date = new Date()) => {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `Today, ${h}:${m}`;
};

function loadActivity(): ActivityItem[] {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as ActivityItem[]) : [];
  } catch {
    return [];
  }
}

function saveActivity(items: ActivityItem[]) {
  window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items.slice(0, 80)));
}

function pushActivity(item: ActivityItem) {
  const next = [item, ...loadActivity().filter((row) => row.id !== item.id)].slice(0, 80);
  saveActivity(next);
  return next;
}

export async function connectEmployer(): Promise<EmployerConnection> {
  if (!isStellarConfigured()) notReady("connectEmployer");
  await delay(120);
  return { address: config.sourcePublicKey ?? config.accounts.employer };
}

/**
 * Staged deposit: records local lifecycle until chain signer is wired.
 * Status starts submitted→pending; confirm via getTransactionStatus.
 */
export async function depositPayroll(amount: string): Promise<DepositPayrollResult> {
  if (!isStellarConfigured()) notReady("depositPayroll");
  await delay(400);
  const pretty = Number(String(amount).replace(/[^0-9.]/g, "") || 0).toLocaleString("en-US");
  const txHash = makeTxHash();
  // Without signer, mark failed so Journey D still works in stellar mode.
  const status: DepositPayrollResult["status"] = "failed";
  txStatuses.set(txHash, "failed");
  txMeta.set(txHash, { kind: "deposit", amount: `+${pretty} USDC`, startedAt: Date.now() });
  pushActivity({
    id: `deposit-${txHash}`,
    kind: "deposit",
    label: "Payroll deposit (awaiting wallet signer)",
    timestamp: formatTs(),
    amount: `+${pretty} USDC`,
    status: "failed",
    txHash,
    counterparty: "Employer treasury",
    createdAt: Date.now(),
  });
  console.warn(
    "[stellar-sdk] depositPayroll requires wallet signTransaction + yieldflow-sdk.chain.js RPC bridge.",
  );
  return { txHash, status };
}

export async function getEmployerStats(): Promise<EmployerStats> {
  if (!isStellarConfigured()) notReady("getEmployerStats");
  await delay(150);
  return {
    totalPool: "0.00",
    yieldEarned: "0.00",
    bufferAmount: "0.00",
    bufferPercent,
    yieldRoutePercent,
    activeEmployees: 0,
    projectedApy: "0.00",
  };
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  await delay(80);
  return { employeeId: window.localStorage.getItem(SESSION_KEY) };
}

export async function loginEmployee(): Promise<EmployeeSession> {
  if (!isStellarConfigured()) notReady("loginEmployee");
  await delay(400);
  const session = {
    employeeId: config.accounts.employee,
    name: "Aditiya Sharma",
    walletAddress: config.accounts.employee,
  };
  window.localStorage.setItem(SESSION_KEY, session.employeeId);
  pushActivity({
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

export async function getEmployeeBalance(_employeeId: string): Promise<EmployeeBalance> {
  if (!isStellarConfigured()) notReady("getEmployeeBalance");
  await delay(120);
  return {
    unlockedAmount: "0.0000000",
    ratePerSecond: "0.0000000",
    totalStreamed: "0.0000000",
    streamCap: "0.0000000",
    nextPayday: "—",
  };
}

export async function withdraw(employeeId: string): Promise<WithdrawResult> {
  if (!isStellarConfigured()) notReady("withdraw");
  await delay(350);
  const current = await getEmployeeBalance(employeeId);
  const txHash = makeTxHash();
  txStatuses.set(txHash, "failed");
  txMeta.set(txHash, {
    kind: "withdraw",
    amount: `-${Number(current.unlockedAmount).toFixed(2)} USDC`,
    startedAt: Date.now(),
  });
  pushActivity({
    id: `withdraw-${txHash}`,
    kind: "withdraw",
    label: "Payout withdrawal (awaiting wallet signer)",
    timestamp: formatTs(),
    amount: `-${Number(current.unlockedAmount).toFixed(2)} USDC`,
    status: "failed",
    txHash,
    counterparty: "Employee wallet",
    createdAt: Date.now(),
  });
  return { txHash, status: "failed", amountReceived: current.unlockedAmount };
}

export async function getTransactionStatus(txHash: string): Promise<TxStatus> {
  await delay(100);
  return txStatuses.get(txHash) ?? "confirmed";
}

export async function getActivity(filter?: ActivityFilterInput): Promise<ActivityItem[]> {
  await delay(80);
  let items = loadActivity();
  if (filter?.kind && filter.kind !== "all") items = items.filter((i) => i.kind === filter.kind);
  if (filter?.status && filter.status !== "all") {
    items = items.filter((i) => (i.status ?? "confirmed") === filter.status);
  }
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    items = items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.amount.toLowerCase().includes(q) ||
        (item.txHash ?? "").toLowerCase().includes(q),
    );
  }
  return items;
}

export async function previewDeposit(amount: string): Promise<DepositPreview> {
  await delay(60);
  const numeric = Number(String(amount).replace(/[^0-9.]/g, "")) || 0;
  return {
    bufferShare: (numeric * (bufferPercent / 100)).toFixed(2),
    yieldShare: (numeric * (yieldRoutePercent / 100)).toFixed(2),
    projectedApy: "4.20",
    bufferPercent,
    yieldRoutePercent,
  };
}

export async function getStreamPhysics(employeeId: string): Promise<StreamPhysics> {
  const balance = await getEmployeeBalance(employeeId);
  const unlocked = Number(balance.unlockedAmount);
  const cap = Number(balance.streamCap) || 1;
  return {
    unlockedAmount: balance.unlockedAmount,
    lockedAmount: Math.max(0, cap - unlocked).toFixed(7),
    ratePerSecond: balance.ratePerSecond,
    secondsToPayday: 14 * 24 * 60 * 60,
    bufferCoverageHours: 0,
    streamCap: balance.streamCap,
    totalStreamed: balance.totalStreamed,
    unlockedPercent: Math.min(100, (unlocked / cap) * 100),
  };
}

export async function getFlowGraph(): Promise<FlowNode[]> {
  const hasSession = Boolean(window.localStorage.getItem(SESSION_KEY));
  return [
    { id: "employer", label: "Employer pool", detail: "Treasury deposit source", active: true },
    { id: "vault", label: "Yield vault", detail: `${yieldRoutePercent}% routed`, active: true },
    { id: "buffer", label: "Instant buffer", detail: `${bufferPercent}% liquid`, active: true },
    { id: "stream", label: "Stream engine", detail: "Continuous wage unlock", active: hasSession },
    { id: "wallet", label: "Employee wallet", detail: "Passkey settlement", active: hasSession },
  ];
}

export async function getTransactionDetail(txHash: string): Promise<TransactionDetail> {
  await delay(80);
  const status = txStatuses.get(txHash) ?? "confirmed";
  const meta = txMeta.get(txHash);
  const startedAt = meta?.startedAt ?? Date.now() - 3000;
  const step = (label: string, offsetMs: number, stepStatus: TxStatus) => ({
    label,
    at: new Date(startedAt + offsetMs).toLocaleTimeString(),
    status: stepStatus,
  });
  const steps =
    status === "failed"
      ? [step("Building", 0, "confirmed"), step("Submitted", 400, "confirmed"), step("Failed", 900, "failed")]
      : [
          step("Building", 0, "confirmed"),
          step("Submitted", 400, "confirmed"),
          step("Pending hop", 900, status === "confirmed" ? "confirmed" : "pending"),
          step("Confirmed", 2200, status === "confirmed" ? "confirmed" : "idle"),
        ];
  return {
    status,
    steps,
    amount: meta?.amount ?? "—",
    kind: meta?.kind ?? "deposit",
    txHash,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${encodeURIComponent(txHash)}`,
  };
}

export async function resetDemo(): Promise<void> {
  window.localStorage.removeItem(ACTIVITY_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  txStatuses.clear();
  txMeta.clear();
}

export async function getSdkInfo(): Promise<SdkMeta> {
  return getSdkMeta();
}
