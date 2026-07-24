export type TxStatus = {
  txId: string;
  status: "success" | "pending" | "failed";
};

export type EmployerConnection = {
  address: string;
  network?: string;
  connectedAt?: string;
};

export type EmployerStats = {
  totalPool: number;
  yieldEarned: number;
  bufferStatus: {
    available: number;
    earningYield: number;
  };
  bufferPercent?: number;
  yieldRoutePercent?: number;
  activeEmployees?: number;
  projectedApy?: string;
};

export type EmployeeSession = {
  employeeId: string;
  name: string;
  walletAddress: string;
};

export type EmployeeBalance = {
  unlockedAmount: number;
  ratePerSecond: number;
  totalStreamed?: number;
  streamCap?: number;
  nextPayday?: string;
};

export type ApprovalStatus = {
  approved: boolean;
  pausedSince?: number;
  employeeId?: string;
  walletAddress?: string;
};

export type ActivityItem = {
  id: string;
  kind: "deposit" | "stream" | "yield" | "withdraw" | "auth";
  label: string;
  timestamp: string;
  amount: string;
};

export interface YieldFlowSDK {
  connectEmployer(): Promise<EmployerConnection>;
  depositPayroll(amount: number): Promise<TxStatus>;
  getEmployerStats(): Promise<EmployerStats>;
  loginEmployee(): Promise<{ employeeId: string; name?: string; walletAddress?: string }>;
  restoreEmployeeSession(): Promise<{ employeeId: string | null }>;
  logoutEmployee(): void;
  getEmployeeBalance(id: string): Promise<EmployeeBalance>;
  withdraw(id: string): Promise<TxStatus & { amountReceived: number }>;
  getActivity(): Promise<ActivityItem[]>;
  approveEmployeePeriod(id: string): Promise<{ approved: boolean; txId?: string; message?: string }>;
  getApprovalStatus(id: string): Promise<ApprovalStatus>;
  resolveEmployeeAddress(id: string): string;
}