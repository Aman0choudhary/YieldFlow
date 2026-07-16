# YieldFlow SDK Contract

This is the Day 1 boundary between the blockchain/integration work and the frontend.

The frontend must import SDK functions and never call Stellar RPC, Smart Account Kit, Passkey Kit, OpenZeppelin Relayer, DeFindex, Blend, or contract clients directly.

## Rules

- Amounts are strings.
- USDC display assumes 7 decimal places on Stellar, but UI components should not hard-code protocol behavior.
- Transactions expose lifecycle states so UI can render pending and failure paths.
- SDK changes are breaking changes unless coordinated.

## Types

```ts
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
```

## Functions

```ts
connectEmployer(): Promise<EmployerConnection>
depositPayroll(amount: string): Promise<DepositPayrollResult>
getEmployerStats(): Promise<EmployerStats>
restoreEmployeeSession(): Promise<{ employeeId: string | null }>
loginEmployee(): Promise<EmployeeSession>
getEmployeeBalance(employeeId: string): Promise<EmployeeBalance>
withdraw(employeeId: string): Promise<WithdrawResult>
getTransactionStatus(txHash: string): Promise<TxStatus>
```
