# YieldFlow SDK Contract

The frontend should import from `sdk/mock-sdk.js` until the real Soroban-backed implementation in `sdk/yieldflow-sdk.js` is ready.

All functions are async and return plain JSON.

The real SDK wrapper now depends on generated Stellar bindings in `sdk/generated/`. Those generated packages must be built before `sdk/yieldflow-sdk.js` can talk to deployed contracts.

## `connectEmployer()`

Connects the employer wallet.

```js
{
  address: "G...",
  network: "stellar-testnet",
  connectedAt: "2026-07-11T00:00:00.000Z"
}
```

## `depositPayroll(amount)`

Deposits test USDC into the vault and splits it between buffer and yield allocation.

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

## `getEmployerStats()`

Returns employer-facing vault and yield data.

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

## `loginEmployee()`

Starts passkey login. The mock resolves immediately; the real SDK should open the passkey prompt internally.

```js
{
  employeeId: "emp_001",
  displayName: "Demo Employee",
  walletAddress: "G...",
  authMethod: "passkey",
  loggedInAt: "2026-07-11T00:00:00.000Z"
}
```

## `getEmployeeBalance(employeeId)`

Returns the streamed balance state for one employee.

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

## `withdraw(employeeId)`

Withdraws unlocked funds using the relayer in the real implementation.

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
