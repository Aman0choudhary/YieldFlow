export type TxStatus =
  | "idle"
  | "authenticating"
  | "building"
  | "submitted"
  | "pending"
  | "confirmed"
  | "failed";

export type EmployerConnection = {
  address: string;
};

export type DepositPayrollResult = {
  txHash: string;
  status: Extract<TxStatus, "submitted" | "confirmed" | "failed">;
};

export type EmployerStats = {
  totalPool: string;
  yieldEarned: string;
  bufferAmount: string;
  bufferPercent: number;
  yieldRoutePercent: number;
  activeEmployees: number;
  projectedApy: string;
};

export type EmployeeSession = {
  employeeId: string;
  name: string;
  walletAddress: string;
};

export type EmployeeBalance = {
  unlockedAmount: string;
  ratePerSecond: string;
  totalStreamed: string;
  streamCap: string;
  nextPayday: string;
};

export type WithdrawResult = {
  txHash: string;
  status: Extract<TxStatus, "submitted" | "confirmed" | "failed">;
  amountReceived: string;
};

export type ActivityItem = {
  id: string;
  kind: "deposit" | "stream" | "yield" | "withdraw" | "auth";
  label: string;
  timestamp: string;
  amount: string;
  status?: TxStatus;
  txHash?: string;
  counterparty?: string;
  createdAt?: number;
};

export type ActivityFilterInput = {
  kind?: ActivityItem["kind"] | "all";
  status?: TxStatus | "all";
  from?: string;
  to?: string;
  query?: string;
};

export type FlowNode = {
  id: string;
  label: string;
  detail: string;
  active: boolean;
};

export type DepositPreview = {
  bufferShare: string;
  yieldShare: string;
  projectedApy: string;
  bufferPercent: number;
  yieldRoutePercent: number;
};

export type StreamPhysics = {
  unlockedAmount: string;
  lockedAmount: string;
  ratePerSecond: string;
  secondsToPayday: number;
  bufferCoverageHours: number;
  streamCap: string;
  totalStreamed: string;
  unlockedPercent: number;
};

export type TransactionStep = {
  label: string;
  at: string;
  status: TxStatus;
};

export type TransactionDetail = {
  status: TxStatus;
  steps: TransactionStep[];
  amount: string;
  kind: string;
  txHash: string;
  explorerUrl: string;
};
