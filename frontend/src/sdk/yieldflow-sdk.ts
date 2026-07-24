/**
 * YieldFlow SDK — live client for Dragonfly UI.
 * Talks to same-origin /api (Vercel serverless) which signs Soroban txs on testnet.
 */

import type {
  ActivityItem,
  ApprovalStatus,
  EmployeeBalance,
  EmployerConnection,
  EmployerStats,
  TxStatus,
  YieldFlowSDK,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/** Demo employee used by live testnet stream (env-backed on server). */
export const DEMO_EMPLOYEE_ID = "emp_001";
export const DEMO_EMPLOYEE_ADDRESS =
  "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4";

const SESSION_KEY = "yieldflow.employeeId";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

function mapTxStatus(status: string | undefined, txId: string): TxStatus {
  if (status === "failed") return { txId, status: "failed" };
  if (status === "pending" || status === "submitted") return { txId, status: "pending" };
  return { txId, status: "success" };
}

class LiveYieldFlowSDK implements YieldFlowSDK {
  resolveEmployeeAddress(id: string): string {
    if (!id || id === DEMO_EMPLOYEE_ID || id === "emp_001") {
      return DEMO_EMPLOYEE_ADDRESS;
    }
    // If UI already passes a G... address, keep it.
    if (id.startsWith("G") && id.length >= 56) return id;
    return DEMO_EMPLOYEE_ADDRESS;
  }

  async connectEmployer(): Promise<EmployerConnection> {
    return apiFetch<EmployerConnection>("/api/employer");
  }

  async depositPayroll(amount: number): Promise<TxStatus> {
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 1;
    const result = await apiFetch<{
      txHash: string;
      status: string;
      amount?: string;
    }>("/api/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: String(safeAmount) }),
    });
    return mapTxStatus(result.status, result.txHash);
  }

  async getEmployerStats(): Promise<EmployerStats> {
    const raw = await apiFetch<{
      totalPool: string | number;
      yieldEarned: string | number;
      bufferAmount: string | number;
      bufferPercent?: number;
      yieldRoutePercent?: number;
      activeEmployees?: number;
      projectedApy?: string;
    }>("/api/stats");

    const totalPool = toNumber(raw.totalPool);
    const bufferAvailable = toNumber(raw.bufferAmount);
    const earningYield = Math.max(0, totalPool - bufferAvailable);

    return {
      totalPool,
      yieldEarned: toNumber(raw.yieldEarned),
      bufferStatus: {
        available: bufferAvailable,
        earningYield,
      },
      bufferPercent: raw.bufferPercent,
      yieldRoutePercent: raw.yieldRoutePercent,
      activeEmployees: raw.activeEmployees ?? 1,
      projectedApy: raw.projectedApy ?? "0.0",
    };
  }

  async loginEmployee(): Promise<{ employeeId: string; name?: string; walletAddress?: string }> {
    const session = await apiFetch<{
      employeeId: string;
      name?: string;
      walletAddress?: string;
    }>("/api/employee/login", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const employeeId = session.employeeId || DEMO_EMPLOYEE_ADDRESS;
    localStorage.setItem(SESSION_KEY, employeeId);
    return {
      employeeId,
      name: session.name || "Demo Employee",
      walletAddress: session.walletAddress || employeeId,
    };
  }

  async restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) return { employeeId: cached };

    try {
      const session = await apiFetch<{ employeeId: string }>("/api/employee/session");
      if (session.employeeId) {
        localStorage.setItem(SESSION_KEY, session.employeeId);
        return { employeeId: session.employeeId };
      }
    } catch {
      /* ignore */
    }
    return { employeeId: null };
  }

  logoutEmployee(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  async getEmployeeBalance(id: string): Promise<EmployeeBalance> {
    const employeeId = this.resolveEmployeeAddress(id);
    const raw = await apiFetch<{
      unlockedAmount: string | number;
      ratePerSecond: string | number;
      totalStreamed?: string | number;
      streamCap?: string | number;
      nextPayday?: string;
    }>(`/api/employee/balance?employeeId=${encodeURIComponent(employeeId)}`);

    return {
      unlockedAmount: toNumber(raw.unlockedAmount),
      ratePerSecond: toNumber(raw.ratePerSecond),
      totalStreamed: toNumber(raw.totalStreamed),
      streamCap: toNumber(raw.streamCap),
      nextPayday: raw.nextPayday,
    };
  }

  async withdraw(id: string): Promise<TxStatus & { amountReceived: number }> {
    const employeeId = this.resolveEmployeeAddress(id);
    const result = await apiFetch<{
      txHash: string;
      status: string;
      amountReceived?: string | number;
    }>("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    });

    return {
      ...mapTxStatus(result.status, result.txHash),
      amountReceived: toNumber(result.amountReceived),
    };
  }

  async getActivity(): Promise<ActivityItem[]> {
    try {
      return await apiFetch<ActivityItem[]>("/api/activity");
    } catch {
      return [];
    }
  }

  /**
   * Approval maps to on-chain stream presence for the demo employee.
   * If a stream already exists (testnet smoke stream), approval succeeds.
   * If missing, server attempts create_stream via signed API.
   */
  async getApprovalStatus(id: string): Promise<ApprovalStatus> {
    const employeeId = this.resolveEmployeeAddress(id);
    try {
      const balance = await this.getEmployeeBalance(employeeId);
      const approved = (balance.streamCap ?? 0) > 0 || balance.unlockedAmount > 0 || (balance.ratePerSecond ?? 0) > 0;
      return {
        approved,
        employeeId,
        walletAddress: employeeId,
      };
    } catch {
      return { approved: false, employeeId, walletAddress: employeeId };
    }
  }

  async approveEmployeePeriod(
    id: string
  ): Promise<{ approved: boolean; txId?: string; message?: string }> {
    const employeeId = this.resolveEmployeeAddress(id);

    // Already-live stream? Treat as approved authorization.
    const existing = await this.getApprovalStatus(employeeId);
    if (existing.approved) {
      return {
        approved: true,
        message: "Stream already active on-chain for this employee.",
      };
    }

    // Attempt on-chain create_stream via API (employer-signed).
    const result = await apiFetch<{
      approved?: boolean;
      txHash?: string;
      status?: string;
      error?: string;
      message?: string;
    }>("/api/stream/create", {
      method: "POST",
      body: JSON.stringify({
        employeeId,
        totalAmount: "5",
        durationDays: 30,
      }),
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      approved: result.approved !== false && result.status !== "failed",
      txId: result.txHash,
      message: result.message || "Stream authorization submitted.",
    };
  }
}

export const sdk: YieldFlowSDK = new LiveYieldFlowSDK();
export default sdk;