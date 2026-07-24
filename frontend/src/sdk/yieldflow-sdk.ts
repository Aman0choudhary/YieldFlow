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
import { loadLocalActivity, mergeActivity, pushLocalActivity } from "./local-persist";
import { loginWithPasskey, clearCredentialSeal } from "./passkey";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/** Demo employee used by live testnet stream (env-backed on server). */
export const DEMO_EMPLOYEE_ID = "emp_001";
export const DEMO_EMPLOYEE_ADDRESS =
  "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4";

const SESSION_KEY = "yieldflow.employeeId";
const SESSION_TOKEN_KEY = "yieldflow.sessionToken";

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
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (token && !headers.authorization) {
    headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
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
    if (id.startsWith("G") && id.length >= 56) return id;
    return DEMO_EMPLOYEE_ADDRESS;
  }

  async connectEmployer(): Promise<EmployerConnection> {
    return apiFetch<EmployerConnection>("/api/employer");
  }

  async depositPayroll(amount: number): Promise<TxStatus> {
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 10;
    const result = await apiFetch<{
      txHash: string;
      status: string;
      amount?: string;
    }>("/api/deposit", {
      method: "POST",
      body: JSON.stringify({ amount: String(safeAmount) }),
    });
    const mapped = mapTxStatus(result.status, result.txHash);
    if (mapped.status === "success") {
      pushLocalActivity({
        id: result.txHash,
        kind: "deposit",
        label: "Payroll deposited (buffer + Blend)",
        timestamp: new Date().toISOString(),
        amount: `+${safeAmount} USDC`,
      });
    }
    return mapped;
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
      blendEnabled?: boolean;
      yieldLiveValue?: string | number;
      yieldStack?: EmployerStats["yieldStack"];
      defindex?: EmployerStats["defindex"];
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
      yieldStack: raw.yieldStack,
      defindex: raw.defindex,
    };
  }

  async loginEmployee(): Promise<{ employeeId: string; name?: string; walletAddress?: string }> {
    // Real browser WebAuthn passkey (register on first visit, auth after that).
    const session = await loginWithPasskey(DEMO_EMPLOYEE_ADDRESS);
    const employeeId = session.employeeId || DEMO_EMPLOYEE_ADDRESS;
    localStorage.setItem(SESSION_KEY, employeeId);
    if (session.sessionToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, session.sessionToken);
    }
    pushLocalActivity({
      id: `auth_${Date.now()}`,
      kind: "auth",
      label: session.registered ? "Passkey registered" : "Passkey login",
      timestamp: new Date().toISOString(),
      amount: employeeId.slice(0, 6) + "…",
    });
    return {
      employeeId,
      name: session.name || "Demo Employee",
      walletAddress: session.walletAddress || employeeId,
    };
  }

  async restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
    const cached = localStorage.getItem(SESSION_KEY);
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (cached && token) return { employeeId: cached };

    try {
      const session = await apiFetch<{ employeeId: string | null }>("/api/employee/session");
      if (session.employeeId) {
        localStorage.setItem(SESSION_KEY, session.employeeId);
        return { employeeId: session.employeeId };
      }
    } catch {
      /* ignore */
    }
    return { employeeId: cached };
  }

  logoutEmployee(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    // Keep enrolled passkey seal so next login uses device biometrics, not re-register.
  }

  /** Full device unlink — user must register passkey again. */
  resetPasskey(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    clearCredentialSeal();
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

    const mapped = mapTxStatus(result.status, result.txHash);
    const amountReceived = toNumber(result.amountReceived);
    if (mapped.status === "success") {
      pushLocalActivity({
        id: result.txHash,
        kind: "withdraw",
        label: "Employee withdrawal",
        timestamp: new Date().toISOString(),
        amount: `-${amountReceived} USDC`,
      });
    }
    return {
      ...mapped,
      amountReceived,
    };
  }

  async getActivity(): Promise<ActivityItem[]> {
    let remote: ActivityItem[] = [];
    try {
      remote = await apiFetch<ActivityItem[]>("/api/activity");
    } catch {
      remote = [];
    }
    return mergeActivity(remote as any, loadLocalActivity()) as ActivityItem[];
  }

  async getApprovalStatus(id: string): Promise<ApprovalStatus> {
    const employeeId = this.resolveEmployeeAddress(id);
    try {
      const balance = await this.getEmployeeBalance(employeeId);
      const approved =
        (balance.streamCap ?? 0) > 0 || balance.unlockedAmount > 0 || (balance.ratePerSecond ?? 0) > 0;
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

    const existing = await this.getApprovalStatus(employeeId);
    if (existing.approved) {
      return {
        approved: true,
        message: "Stream already active on-chain for this employee.",
      };
    }

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
        totalAmount: "50",
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

