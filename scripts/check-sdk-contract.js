import sdk from "../sdk/mock-sdk.js";

const requiredKeys = (label, object, keys) => {
  const missing = keys.filter((key) => !(key in object));
  if (missing.length > 0) {
    throw new Error(`${label} is missing keys: ${missing.join(", ")}`);
  }
};

const employer = await sdk.connectEmployer();
requiredKeys("connectEmployer", employer, ["address", "network", "connectedAt"]);

const deposit = await sdk.depositPayroll(1000);
requiredKeys("depositPayroll", deposit, [
  "txId",
  "status",
  "token",
  "amount",
  "bufferAllocated",
  "yieldAllocated",
  "depositedAt"
]);

const stats = await sdk.getEmployerStats();
requiredKeys("getEmployerStats", stats, [
  "token",
  "network",
  "totalPool",
  "totalDeposited",
  "yieldEarned",
  "yieldApy",
  "bufferStatus",
  "activeEmployees",
  "updatedAt"
]);

const employee = await sdk.loginEmployee();
requiredKeys("loginEmployee", employee, [
  "employeeId",
  "displayName",
  "walletAddress",
  "authMethod",
  "loggedInAt"
]);

const balance = await sdk.getEmployeeBalance(employee.employeeId);
requiredKeys("getEmployeeBalance", balance, [
  "employeeId",
  "token",
  "unlockedAmount",
  "withdrawnAmount",
  "withdrawableAmount",
  "ratePerSecond",
  "streamTotal",
  "streamStartedAt",
  "streamEndsAt",
  "updatedAt"
]);

const withdrawal = await sdk.withdraw(employee.employeeId);
requiredKeys("withdraw", withdrawal, [
  "txId",
  "status",
  "token",
  "amountReceived",
  "gasPaidBy",
  "withdrawnAt"
]);

console.log("SDK contract check passed.");
