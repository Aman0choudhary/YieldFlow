export type TxStatus = { txId: string; status: 'success' | 'pending' | 'failed' };

export type EmployerStats = {
  totalPool: number;
  yieldEarned: number;
  bufferStatus: {
    available: number;
    earningYield: number;
  };
};

export type EmployeeBalance = {
  unlockedAmount: number;
  ratePerSecond: number;
};

export type ApprovalStatus = {
  approved: boolean;
  pausedSince?: number; // timestamp
};

export interface YieldFlowSDK {
  connectEmployer(): Promise<{ address: string }>;
  depositPayroll(amount: number): Promise<TxStatus>;
  getEmployerStats(): Promise<EmployerStats>;
  loginEmployee(): Promise<{ employeeId: string }>;
  getEmployeeBalance(id: string): Promise<EmployeeBalance>;
  withdraw(id: string): Promise<TxStatus & { amountReceived: number }>;
  approveEmployeePeriod(id: string): Promise<{ approved: boolean }>;
  getApprovalStatus(id: string): Promise<ApprovalStatus>;
}
