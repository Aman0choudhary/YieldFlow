# YieldFlow SDK contract (UI ↔ chain boundary)

Frontend must import only the SDK surface and never call Stellar RPC, Smart Account Kit,
Passkey Kit, OpenZeppelin Relayer, DeFindex, Blend, or contract clients directly.

There are two closely related entry points during the dual-path MVP:

| Path | Entry | Status |
|---|---|---|
| Frontend demo (Vite) | `sdk/yieldflow-sdk.ts` → mock or stellar TS surface | mock default |
| Integration / generated clients | `sdk/yieldflow-sdk.chain.js` + `sdk/generated/*` | Aman path |
| Day-1 mock (JS) | `sdk/mock-sdk.js` | shape checks via `scripts/check-sdk-contract.js` |

All functions are async and return plain JSON / serializable objects.

## Mode selection (frontend TS)

| Env | Behavior |
|---|---|
| `VITE_YIELDFLOW_SDK=mock` (default) | `sdk/mock-sdk.ts` |
| `VITE_YIELDFLOW_SDK=stellar` | `sdk/stellar-sdk.ts` only if contract IDs are set in `sdk/config.ts`; otherwise falls back to mock with console warning |

Helpers: `getSdkMeta()` / `getSdkInfo()`.

The real JS SDK wrapper depends on generated Stellar bindings in `sdk/generated/`. Those packages must be built before `sdk/yieldflow-sdk.chain.js` can talk to deployed contracts.

## Rules

- Prefer **string amounts** on the frontend TS boundary for display safety.
- USDC on Stellar is 7 decimals; UI must not hard-code protocol math beyond display.
- Transactions expose lifecycle: `idle | authenticating | building | submitted | pending | confirmed | failed`.
- SDK changes are breaking unless coordinated.
- Activity history (frontend mock): **SDK is source of truth**; UI reloads via `getActivity` and patches status from polling.

## Core JS shapes (integration mock / real wrapper)

### `connectEmployer()`

```js
{
  address: "G...",
  network: "stellar-testnet",
  connectedAt: "2026-07-11T00:00:00.000Z"
}
```

### `depositPayroll(amount)`

```js
{
  txId: "deposit_...",
  status: "success",
  token: "USDC",
  amount: 10000,
  bufferAllocated: 1500,
  yieldAllocated: 8500,
  depositedAt: "2026-07-11T00:00:00.000Z"
}
```

### `getEmployerStats()`

```js
{
  token: "USDC",
  network: "stellar-testnet",
  totalPool: 50000.12,
  totalDeposited: 50000,
  yieldEarned: 0.12,
  yieldApy: 0.081,
  bufferStatus: {
    available: 7500,
    targetRatio: 0.15,
    currentRatio: 0.15,
    status: "healthy"
  },
  activeEmployees: 1,
  updatedAt: "2026-07-11T00:00:00.000Z"
}
```

### `loginEmployee()`

```js
{
  employeeId: "emp_001",
  displayName: "Demo Employee",
  walletAddress: "G...",
  authMethod: "passkey",
  loggedInAt: "2026-07-11T00:00:00.000Z"
}
```

### `getEmployeeBalance(employeeId)`

```js
{
  employeeId: "emp_001",
  token: "USDC",
  unlockedAmount: 0.833333,
  withdrawnAmount: 0,
  withdrawableAmount: 0.833333,
  ratePerSecond: 0.001157,
  streamTotal: 3000,
  streamStartedAt: "2026-07-11T00:00:00.000Z",
  streamEndsAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-07-11T00:00:00.000Z"
}
```

### `withdraw(employeeId)`

```js
{
  txId: "withdraw_...",
  status: "success",
  token: "USDC",
  amountReceived: 0.833333,
  gasPaidBy: "relayer",
  withdrawnAt: "2026-07-11T00:00:00.000Z"
}
```

## Frontend TypeScript surface (mock-first demo)

```ts
connectEmployer(): Promise<EmployerConnection>
depositPayroll(amount: string): Promise<DepositPayrollResult>
getEmployerStats(): Promise<EmployerStats>
restoreEmployeeSession(): Promise<{ employeeId: string | null }>
loginEmployee(): Promise<EmployeeSession>
getEmployeeBalance(employeeId: string): Promise<EmployeeBalance>
withdraw(employeeId: string): Promise<WithdrawResult>
getTransactionStatus(txHash: string): Promise<TxStatus>
getActivity(filter?: ActivityFilterInput): Promise<ActivityItem[]>
previewDeposit(amount: string): Promise<DepositPreview>
getStreamPhysics(employeeId: string): Promise<StreamPhysics>
getFlowGraph(): Promise<FlowNode[]>
getTransactionDetail(txHash: string): Promise<TransactionDetail>
resetDemo(): Promise<void>
getSdkMeta(): SdkMeta
getSdkInfo(): Promise<SdkMeta>
```

## Phase 3 swap path

1. Deploy `vault`, `streaming`, `defindex_router` (`npm run deploy:testnet`).
2. Write contract IDs to `deployments/testnet.json`, `config/testnet-usdc.json`, `sdk/config.ts`.
3. Implement RPC invokes inside `sdk/stellar-sdk.ts` (and keep `sdk/yieldflow-sdk.chain.js` aligned).
4. Set `VITE_YIELDFLOW_SDK=stellar` and rebuild the frontend.
5. Keep passkey optional with mock fallback for demos.

## Notes

- Mock `getActivity` (TS) persists runtime deposits/withdrawals/auth in `localStorage`.
- Passkey is simulated in mock.
- UI never imports stellar clients directly.
