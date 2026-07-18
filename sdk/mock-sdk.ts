import type {
  ActivityItem,
  DepositPayrollResult,
  EmployeeBalance,
  EmployeeSession,
  EmployerConnection,
  EmployerStats,
  TxStatus,
  WithdrawResult,
} from "./types";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const txStatuses = new Map<string, TxStatus>();
const employeeStartedAt = Date.now() - 1000 * 60 * 60 * 18;
const employeeBaseUnlocked = 1245.6793;
const ratePerSecond = 0.00015;

const makeTxHash = () => {
  const chunk = () => Math.random().toString(16).slice(2, 10);
  return `0x${chunk()}${chunk()}${chunk()}`;
};

const maybeFail = (chance = 0.08) => Math.random() < chance;

export async function connectEmployer(): Promise<EmployerConnection> {
  await delay(500);
  return { address: "GBYF...EMPLOYER...P4Y" };
}

export async function depositPayroll(amount: string): Promise<DepositPayrollResult> {
  await delay(650);
  const txHash = makeTxHash();
  const status: DepositPayrollResult["status"] = maybeFail(0.05) ? "failed" : "submitted";
  txStatuses.set(txHash, status === "failed" ? "failed" : "pending");
  void delay(2200).then(() => {
    if (txStatuses.get(txHash) === "pending") txStatuses.set(txHash, "confirmed");
  });
  console.info(`Mock deposit payroll: ${amount} USDC`);
  return { txHash, status };
}

export async function getEmployerStats(): Promise<EmployerStats> {
  await delay(350);
  return {
    totalPool: "245000.00",
    yieldEarned: "1240.50",
    bufferAmount: "36750.00",
    bufferPercent: 15,
    yieldRoutePercent: 85,
    activeEmployees: 12,
    projectedApy: "4.2",
  };
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  await delay(300);
  return { employeeId: window.localStorage.getItem("yieldflow.employeeId") };
}

export async function loginEmployee(): Promise<EmployeeSession> {
  await delay(900);
  if (maybeFail(0.05)) throw new Error("Passkey prompt was cancelled. Try again when ready.");
  const session = {
    employeeId: "emp_aditiya_001",
    name: "Aditiya Sharma",
    walletAddress: "CCONTRACT...PASSKEY...YF01",
  };
  window.localStorage.setItem("yieldflow.employeeId", session.employeeId);
  return session;
}

export async function getEmployeeBalance(employeeId: string): Promise<EmployeeBalance> {
  await delay(250);
  const elapsed = Math.max(0, (Date.now() - employeeStartedAt) / 1000);
  const unlocked = employeeBaseUnlocked + elapsed * ratePerSecond;
  console.info(`Mock balance request for ${employeeId}`);
  return {
    unlockedAmount: unlocked.toFixed(7),
    ratePerSecond: ratePerSecond.toFixed(7),
    totalStreamed: "3920.4000000",
    streamCap: "5000.0000000",
    nextPayday: "14 days",
  };
}

export async function withdraw(employeeId: string): Promise<WithdrawResult> {
  await delay(550);
  const current = await getEmployeeBalance(employeeId);
  const txHash = makeTxHash();
  const status: WithdrawResult["status"] = maybeFail(0.08) ? "failed" : "submitted";
  txStatuses.set(txHash, status === "failed" ? "failed" : "pending");
  void delay(2400).then(() => {
    if (txStatuses.get(txHash) === "pending") txStatuses.set(txHash, "confirmed");
  });
  return { txHash, status, amountReceived: current.unlockedAmount };
}

export async function getTransactionStatus(txHash: string): Promise<TxStatus> {
  await delay(250);
  return txStatuses.get(txHash) ?? "confirmed";
}

export async function getActivity(): Promise<ActivityItem[]> {
  await delay(250);
  return [
    { id: "act_1", kind: "deposit", label: "Payroll deposit", timestamp: "Today, 09:41", amount: "+50,000 USDC" },
    { id: "act_2", kind: "stream", label: "Employee streams settled", timestamp: "Today, 00:00", amount: "-1,250 USDC" },
    { id: "act_3", kind: "yield", label: "Yield harvested", timestamp: "Yesterday", amount: "+42.50 USDC" },
    { id: "act_4", kind: "auth", label: "Passkey session restored", timestamp: "Yesterday", amount: "Employee" },
  ];
}
