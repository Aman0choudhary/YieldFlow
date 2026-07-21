/**
 * YieldFlow SDK entry — UI imports only this module (via frontend/src/sdk/yieldflow-sdk.ts).
 *
 * Mode selection:
 *   VITE_YIELDFLOW_SDK=mock     (default) → mock-sdk
 *   VITE_YIELDFLOW_SDK=stellar  → stellar-sdk when contracts configured; otherwise mock with warning
 *
 * Never import Stellar RPC clients from React components.
 */
import { contractsReady, resolveSdkMode, TESTNET_CONFIG, type SdkMeta } from "./config";
import * as mock from "./mock-sdk";
import * as stellar from "./stellar-sdk";

export * from "./types";

function readEnvMode(): string | undefined {
  try {
    // Vite injects import.meta.env at build time for frontend.
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_YIELDFLOW_SDK;
  } catch {
    return undefined;
  }
}

const mode = resolveSdkMode(readEnvMode());
const wantStellar = mode === "stellar";
const stellarReady = contractsReady(TESTNET_CONFIG);

const live = wantStellar && stellarReady ? stellar : mock;

if (wantStellar && !stellarReady && typeof console !== "undefined") {
  console.warn(
    "[YieldFlow] VITE_YIELDFLOW_SDK=stellar but contracts are not configured. Falling back to mock-sdk.",
    stellar.getSdkMeta(),
  );
}

export const connectEmployer = live.connectEmployer;
export const depositPayroll = live.depositPayroll;
export const getEmployerStats = live.getEmployerStats;
export const restoreEmployeeSession = live.restoreEmployeeSession;
export const loginEmployee = live.loginEmployee;
export const getEmployeeBalance = live.getEmployeeBalance;
export const withdraw = live.withdraw;
export const getTransactionStatus = live.getTransactionStatus;
export const getActivity = live.getActivity;
export const previewDeposit = live.previewDeposit;
export const getStreamPhysics = live.getStreamPhysics;
export const getFlowGraph = live.getFlowGraph;
export const getTransactionDetail = live.getTransactionDetail;
export const resetDemo = live.resetDemo;

export function getSdkMeta(): SdkMeta {
  if (wantStellar && stellarReady) return stellar.getSdkMeta();
  return {
    mode: "mock",
    network: "mock-local",
    ready: true,
    reason:
      wantStellar && !stellarReady
        ? "Requested stellar mode but contracts missing — using mock"
        : undefined,
    contracts: TESTNET_CONFIG.contracts,
  };
}

export async function getSdkInfo(): Promise<SdkMeta> {
  return getSdkMeta();
}
