const TOKEN = "USDC";
const NETWORK = "stellar-testnet";
const BUFFER_TARGET_RATIO = 0.15;
const YIELD_TARGET_RATIO = 0.85;
const MOCK_APY = 0.081;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

const nowIso = () => new Date().toISOString();
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 1000000) / 1000000;

const makeTxId = (prefix) => {
  const random = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${Date.now().toString(16)}_${random}`;
};

const startedAt = Date.now() - 12 * 60 * 1000;
const streamEndsAt = startedAt + 30 * 24 * 60 * 60 * 1000;

const state = {
  employer: {
    address: "GDEMOEMPLOYER7YIELDFLOWMOCKADDRESS000000000000000000",
    connected: false
  },
  vault: {
    totalDeposited: 50000,
    bufferBalance: 7500,
    yieldPrincipal: 42500,
    yieldStartedAt: startedAt,
    withdrawalsTotal: 0
  },
  employees: {
    emp_001: {
      employeeId: "emp_001",
      displayName: "Demo Employee",
      walletAddress: "GDEMOEMPLOYEE7YIELDFLOWMOCKADDRESS00000000000000000",
      streamTotal: 3000,
      withdrawnAmount: 0,
      streamStartedAt: startedAt,
      streamEndsAt
    }
  }
};

const txStatuses = new Map();

const getAccruedYield = () => {
  const elapsedSeconds = Math.max(0, (Date.now() - state.vault.yieldStartedAt) / 1000);
  return roundMoney(state.vault.yieldPrincipal * MOCK_APY * (elapsedSeconds / SECONDS_PER_YEAR));
};

const getEmployee = (employeeId) => {
  const employee = state.employees[employeeId];
  if (!employee) {
    throw new Error(`Unknown employee: ${employeeId}`);
  }
  return employee;
};

const getUnlockedAmount = (employee) => {
  const durationMs = employee.streamEndsAt - employee.streamStartedAt;
  const elapsedMs = Math.min(Math.max(Date.now() - employee.streamStartedAt, 0), durationMs);
  return roundMoney(employee.streamTotal * (elapsedMs / durationMs));
};

const toEmployeeBalance = (employee) => {
  const unlockedAmount = getUnlockedAmount(employee);
  const withdrawableAmount = Math.max(0, roundMoney(unlockedAmount - employee.withdrawnAmount));
  const durationSeconds = (employee.streamEndsAt - employee.streamStartedAt) / 1000;

  return {
    employeeId: employee.employeeId,
    token: TOKEN,
    unlockedAmount,
    withdrawnAmount: roundMoney(employee.withdrawnAmount),
    withdrawableAmount,
    ratePerSecond: roundMoney(employee.streamTotal / durationSeconds),
    streamTotal: roundMoney(employee.streamTotal),
    streamStartedAt: new Date(employee.streamStartedAt).toISOString(),
    streamEndsAt: new Date(employee.streamEndsAt).toISOString(),
    updatedAt: nowIso()
  };
};

export async function connectEmployer() {
  await wait();
  state.employer.connected = true;

  return {
    address: state.employer.address,
    network: NETWORK,
    connectedAt: nowIso()
  };
}

export async function depositPayroll(amount) {
  await wait();

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("depositPayroll(amount) requires a positive amount.");
  }

  const bufferAllocated = roundMoney(numericAmount * BUFFER_TARGET_RATIO);
  const yieldAllocated = roundMoney(numericAmount * YIELD_TARGET_RATIO);

  state.vault.totalDeposited = roundMoney(state.vault.totalDeposited + numericAmount);
  state.vault.bufferBalance = roundMoney(state.vault.bufferBalance + bufferAllocated);
  state.vault.yieldPrincipal = roundMoney(state.vault.yieldPrincipal + yieldAllocated);

  const txId = makeTxId("deposit");
  txStatuses.set(txId, "pending");
  setTimeout(() => {
    if (txStatuses.get(txId) === "pending") {
      txStatuses.set(txId, "confirmed");
    }
  }, 2200);

  return {
    txId,
    txHash: txId,
    status: "success",
    token: TOKEN,
    amount: roundMoney(numericAmount),
    bufferAllocated,
    yieldAllocated,
    depositedAt: nowIso()
  };
}

export async function getEmployerStats() {
  await wait(150);

  const yieldEarned = getAccruedYield();
  const totalPool = roundMoney(state.vault.bufferBalance + state.vault.yieldPrincipal + yieldEarned);
  const currentRatio = totalPool > 0 ? roundMoney(state.vault.bufferBalance / totalPool) : 0;

  return {
    token: TOKEN,
    network: NETWORK,
    totalPool,
    totalDeposited: roundMoney(state.vault.totalDeposited),
    yieldEarned,
    yieldApy: MOCK_APY,
    bufferStatus: {
      available: roundMoney(state.vault.bufferBalance),
      targetRatio: BUFFER_TARGET_RATIO,
      currentRatio,
      status: currentRatio >= BUFFER_TARGET_RATIO * 0.7 ? "healthy" : "rebalance_needed"
    },
    activeEmployees: Object.keys(state.employees).length,
    updatedAt: nowIso()
  };
}

export async function loginEmployee() {
  await wait();

  const employee = state.employees.emp_001;
  return {
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    walletAddress: employee.walletAddress,
    authMethod: "passkey",
    loggedInAt: nowIso()
  };
}

export async function restoreEmployeeSession() {
  await wait(150);
  return { employeeId: null };
}

export async function getEmployeeBalance(employeeId) {
  await wait(150);
  return toEmployeeBalance(getEmployee(employeeId));
}

export async function withdraw(employeeId) {
  await wait();

  const employee = getEmployee(employeeId);
  const balance = toEmployeeBalance(employee);
  const amountReceived = Math.min(balance.withdrawableAmount, state.vault.bufferBalance);

  if (amountReceived <= 0) {
    return {
      txId: null,
      status: "nothing_to_withdraw",
      token: TOKEN,
      amountReceived: 0,
      gasPaidBy: "relayer",
      withdrawnAt: nowIso()
    };
  }

  employee.withdrawnAmount = roundMoney(employee.withdrawnAmount + amountReceived);
  state.vault.bufferBalance = roundMoney(state.vault.bufferBalance - amountReceived);
  state.vault.withdrawalsTotal = roundMoney(state.vault.withdrawalsTotal + amountReceived);

  const txId = makeTxId("withdraw");
  txStatuses.set(txId, "pending");
  setTimeout(() => {
    if (txStatuses.get(txId) === "pending") {
      txStatuses.set(txId, "confirmed");
    }
  }, 2400);

  return {
    txId,
    txHash: txId,
    status: "success",
    token: TOKEN,
    amountReceived: roundMoney(amountReceived),
    gasPaidBy: "relayer",
    withdrawnAt: nowIso()
  };
}

export async function getTransactionStatus(txId) {
  await wait(150);
  return txStatuses.get(txId) ?? "confirmed";
}

export async function getActivity() {
  await wait(150);
  return [
    { id: "act_1", kind: "deposit", label: "Payroll deposit", timestamp: "Today, 09:41", amount: "+50,000 USDC" },
    { id: "act_2", kind: "stream", label: "Employee streams settled", timestamp: "Today, 00:00", amount: "-1,250 USDC" },
    { id: "act_3", kind: "yield", label: "Yield harvested", timestamp: "Yesterday", amount: "+42.50 USDC" },
    { id: "act_4", kind: "auth", label: "Passkey session restored", timestamp: "Yesterday", amount: "Employee" }
  ];
}

export const sdk = {
  connectEmployer,
  depositPayroll,
  getEmployerStats,
  restoreEmployeeSession,
  loginEmployee,
  getEmployeeBalance,
  withdraw,
  getTransactionStatus,
  getActivity
};

export default sdk;
