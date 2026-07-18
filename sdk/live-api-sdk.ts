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

const meta = import.meta as ImportMeta & { env?: Record<string, string | undefined> };
const API_URL = meta.env?.VITE_YIELDFLOW_API_URL || "http://127.0.0.1:8787";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `YieldFlow API request failed: ${path}`);
  }
  return body as T;
}

export async function connectEmployer(): Promise<EmployerConnection> {
  return request<EmployerConnection>("/api/employer");
}

export async function depositPayroll(amount: string): Promise<DepositPayrollResult> {
  return request<DepositPayrollResult>("/api/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getEmployerStats(): Promise<EmployerStats> {
  return request<EmployerStats>("/api/stats");
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  return request<{ employeeId: string | null }>("/api/employee/session");
}

export async function loginEmployee(): Promise<EmployeeSession> {
  return request<EmployeeSession>("/api/employee/login", { method: "POST" });
}

export async function getEmployeeBalance(employeeId: string): Promise<EmployeeBalance> {
  return request<EmployeeBalance>(`/api/employee/balance?employeeId=${encodeURIComponent(employeeId)}`);
}

export async function withdraw(employeeId: string): Promise<WithdrawResult> {
  return request<WithdrawResult>("/api/withdraw", {
    method: "POST",
    body: JSON.stringify({ employeeId }),
  });
}

export async function getTransactionStatus(txHash: string): Promise<TxStatus> {
  const result = await request<{ status: TxStatus }>(`/api/tx/status?txHash=${encodeURIComponent(txHash)}`);
  return result.status;
}

export async function getActivity(): Promise<ActivityItem[]> {
  return request<ActivityItem[]>("/api/activity");
}
