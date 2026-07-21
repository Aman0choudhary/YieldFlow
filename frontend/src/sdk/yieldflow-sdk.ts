/**
 * YieldFlow SDK — live API client.
 *
 * Calls the deployed YieldFlow backend to interact with real
 * Stellar testnet contracts. Same function signatures as the
 * previous mock SDK so App.tsx requires zero changes.
 */

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

export type { ActivityItem, EmployeeBalance, EmployeeSession, EmployerConnection, EmployerStats, TxStatus, WithdrawResult, DepositPayrollResult };

/* ── Config ──────────────────────────────────────────── */

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}

/* ── SDK Functions ───────────────────────────────────── */

export async function connectEmployer(): Promise<EmployerConnection> {
  return apiFetch<EmployerConnection>("/api/employer");
}

export async function depositPayroll(amount: string): Promise<DepositPayrollResult> {
  return apiFetch<DepositPayrollResult>("/api/deposit", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getEmployerStats(): Promise<EmployerStats> {
  return apiFetch<EmployerStats>("/api/stats");
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  // Check local storage first for a cached session
  const cached = localStorage.getItem("yieldflow.employeeId");
  if (cached) {
    return { employeeId: cached };
  }

  try {
    const session = await apiFetch<{ employeeId: string }>("/api/employee/session");
    return { employeeId: session.employeeId || null };
  } catch {
    return { employeeId: null };
  }
}

export async function loginEmployee(): Promise<EmployeeSession> {
  const session = await apiFetch<EmployeeSession>("/api/employee/login", {
    method: "POST",
    body: JSON.stringify({}),
  });
  localStorage.setItem("yieldflow.employeeId", session.employeeId);
  return session;
}

export async function getEmployeeBalance(employeeId: string): Promise<EmployeeBalance> {
  return apiFetch<EmployeeBalance>(
    `/api/employee/balance?employeeId=${encodeURIComponent(employeeId)}`
  );
}

export async function withdraw(employeeId: string): Promise<WithdrawResult> {
  return apiFetch<WithdrawResult>("/api/withdraw", {
    method: "POST",
    body: JSON.stringify({ employeeId }),
  });
}

export async function getTransactionStatus(txHash: string): Promise<TxStatus> {
  const result = await apiFetch<{ status: TxStatus }>(
    `/api/tx/status?txHash=${encodeURIComponent(txHash)}`
  );
  return result.status;
}

export async function getActivity(): Promise<ActivityItem[]> {
  return apiFetch<ActivityItem[]>("/api/activity");
}
