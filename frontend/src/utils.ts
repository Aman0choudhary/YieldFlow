import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { ActivityItem, TxStatus } from "./sdk/yieldflow-sdk";
import type { AppPage, ActivityFilter, StatusFilter, QueuedTx } from "./types";

export const kindIcons = {
  deposit: ArrowUpRight,
  withdraw: ArrowDownRight,
  stream: Layers,
  yield: Sparkles,
  auth: Wallet,
} as const;

export const kindLabel: Record<ActivityItem["kind"], string> = {
  deposit: "Payroll deposit",
  withdraw: "Withdraw settled",
  stream: "Employee stream",
  yield: "Yield harvested",
  auth: "Passkey restored",
};

export const kindDetail: Record<ActivityItem["kind"], string> = {
  deposit: "Employer treasury funded the payroll pool and allocated capital to yield routes.",
  withdraw: "Unlocked stream balance settled to the employee wallet after confirmation.",
  stream: "Continuous wage settlement moved from vault allocation into employee streams.",
  yield: "Harvested return from the yield vault was credited back into the treasury pool.",
  auth: "Passkey session restored for employee access to live balances and withdrawals.",
};

export const formatMoney = (value: number, digits = 2) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const shortAddress = (address: string) =>
  address.length <= 16 ? address : `${address.slice(0, 8)}...${address.slice(-6)}`;

export const explorerUrl = (txHash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${encodeURIComponent(txHash)}`;

export const navItems: Array<{ id: AppPage; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "flows", label: "Flows" },
  { id: "activity", label: "Activity" },
];

export const activityFilters: Array<{ id: ActivityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "stream", label: "Streams" },
  { id: "yield", label: "Yield" },
  { id: "auth", label: "Auth" },
];

export const statusFilters: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Any status" },
  { id: "pending", label: "Pending" },
  { id: "submitted", label: "Submitted" },
  { id: "confirmed", label: "Confirmed" },
  { id: "failed", label: "Failed" },
];

export const pageCopy = {
  dashboard: {
    eyebrow: "Command center",
    title: "Am I healthy right now?",
    body: "Treasury health, session status, stream summary, and deep links — not the place to operate the pipeline.",
  },
  flows: {
    eyebrow: "Capital pipeline",
    title: "How does money move, and can I operate it?",
    body: "Fund payroll, allocate buffer vs yield, drive the stream engine, and settle withdrawals hop by hop.",
  },
  activity: {
    eyebrow: "Settlement ledger",
    title: "What happened, and can I prove it?",
    body: "Filter the full audit feed, inspect the transaction queue, and jump back to Flows to operate.",
  },
} as const;

export const parseHashPage = (hash: string): AppPage | null => {
  const raw = hash.replace(/^#\/?/, "").toLowerCase();
  if (raw === "dashboard" || raw === "flows" || raw === "activity") return raw;
  return null;
};

export const pageToHash = (page: AppPage) => `#/${page}`;

export type HopStep = {
  id: string;
  label: string;
  detail: string;
  state: "done" | "current" | "idle" | "failed";
};

export const hopTimeline = (activeTx: QueuedTx | undefined): HopStep[] => {
  if (!activeTx) {
    return [
      { id: "build", label: "Building", detail: "Idle", state: "idle" },
      { id: "submit", label: "Submitted", detail: "Waiting for op", state: "idle" },
      { id: "pending", label: "Pending hop", detail: "2/4", state: "idle" },
      { id: "confirm", label: "Confirmed", detail: "Final", state: "idle" },
    ];
  }

  const status = activeTx.status as TxStatus;
  if (status === "failed") {
    return [
      { id: "build", label: "Building", detail: "Complete", state: "done" },
      { id: "submit", label: "Submitted", detail: "Complete", state: "done" },
      { id: "pending", label: "Failed", detail: "Rejected", state: "failed" },
      { id: "confirm", label: "Confirmed", detail: "Skipped", state: "idle" },
    ];
  }
  if (status === "confirmed") {
    return [
      { id: "build", label: "Building", detail: "Complete", state: "done" },
      { id: "submit", label: "Submitted", detail: "Complete", state: "done" },
      { id: "pending", label: "Pending hop", detail: "2/4", state: "done" },
      { id: "confirm", label: "Confirmed", detail: "Settled", state: "done" },
    ];
  }
  if (status === "submitted") {
    return [
      { id: "build", label: "Building", detail: "Complete", state: "done" },
      { id: "submit", label: "Submitted", detail: "Broadcast", state: "current" },
      { id: "pending", label: "Pending hop", detail: "2/4", state: "idle" },
      { id: "confirm", label: "Confirmed", detail: "Final", state: "idle" },
    ];
  }
  // pending
  return [
    { id: "build", label: "Building", detail: "Complete", state: "done" },
    { id: "submit", label: "Submitted", detail: "Complete", state: "done" },
    { id: "pending", label: "Pending hop", detail: "2/4", state: "current" },
    { id: "confirm", label: "Confirmed", detail: "Final", state: "idle" },
  ];
};
