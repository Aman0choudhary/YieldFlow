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
};
