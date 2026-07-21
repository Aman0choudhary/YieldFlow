import type { ActivityItem, TxStatus, TransactionDetail } from "./sdk/yieldflow-sdk";

export type AppPage = "dashboard" | "flows" | "activity";
export type ActivityFilter = "all" | ActivityItem["kind"];
export type StatusFilter = "all" | TxStatus;

export type QueuedTx = {
  txHash: string;
  status: TxStatus;
  kind: "deposit" | "withdraw";
  amount: string;
  startedAt: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "error";
  timestamp: number;
};

export type DisplayStats = {
  totalPool: string;
  yieldEarned: string;
  bufferAmount: string;
  activeEmployees: number;
  projectedApy: string;
  bufferPercent: number;
  yieldRoutePercent: number;
};

export type AppSettings = {
  reducedMotion: boolean;
  showSettings: boolean;
};

export type { TransactionDetail };
