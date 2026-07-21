/**
 * Phase 3: real Stellar / Soroban implementation surface.
 *
 * Rules:
 * - Same exports as mock-sdk.ts so UI imports never change.
 * - Amounts remain strings.
 * - Lifecycle states: idle | authenticating | building | submitted | pending | confirmed | failed
 * - Until contracts are deployed and wired, live calls throw a clear error.
 * - yieldflow-sdk.ts falls back to mock unless VITE_YIELDFLOW_SDK=stellar and contracts are ready,
 *   or use force-mock path below via getSdkMeta().
 *
 * Swap checklist:
 * 1. Deploy vault / streaming / defindex_router (scripts/deploy-testnet.ps1)
 * 2. Write contract IDs into config/testnet-usdc.json + sdk/config.ts
 * 3. Install @stellar/stellar-sdk (or soroban client) when implementing RPC invokes
 * 4. Set VITE_YIELDFLOW_SDK=stellar
 * 5. Keep passkey optional with mock fallback for demos
 */

import type {
  ActivityFilterInput,
  ActivityItem,
  DepositPayrollResult,
  DepositPreview,
  EmployeeBalance,
  EmployeeSession,
  EmployerConnection,
  EmployerStats,
  FlowNode,
  StreamPhysics,
  TransactionDetail,
  TxStatus,
  WithdrawResult,
} from "./types";
import {
  TESTNET_CONFIG,
  contractsReady,
  type SdkMeta,
  type YieldFlowNetworkConfig,
} from "./config";

const config: YieldFlowNetworkConfig = TESTNET_CONFIG;

export function getSdkMeta(): SdkMeta {
  const ready = contractsReady(config);
  return {
    mode: "stellar",
    network: config.network,
    ready,
    reason: ready
      ? undefined
      : "Contract IDs not set. Deploy scaffolds and update sdk/config.ts / config/testnet-usdc.json.",
    contracts: config.contracts,
  };
}

function notWired(name: string): never {
  const meta = getSdkMeta();
  throw new Error(
    `stellar-sdk.${name} is not live yet. ${meta.reason ?? "Complete Phase 3 RPC wiring."} ` +
      `Use mock mode (default) or finish deploy + client invokes.`,
  );
}

/** True when vault + streaming IDs are present (RPC client still required to call). */
export function isStellarConfigured(): boolean {
  return contractsReady(config);
}

export async function connectEmployer(): Promise<EmployerConnection> {
  if (!isStellarConfigured()) notWired("connectEmployer");
  // Future: load employer G-address / smart account from wallet kit
  return { address: config.accounts.employer };
}

export async function depositPayroll(_amount: string): Promise<DepositPayrollResult> {
  notWired("depositPayroll");
}

export async function getEmployerStats(): Promise<EmployerStats> {
  notWired("getEmployerStats");
}

export async function restoreEmployeeSession(): Promise<{ employeeId: string | null }> {
  notWired("restoreEmployeeSession");
}

export async function loginEmployee(): Promise<EmployeeSession> {
  notWired("loginEmployee");
}

export async function getEmployeeBalance(_employeeId: string): Promise<EmployeeBalance> {
  notWired("getEmployeeBalance");
}

export async function withdraw(_employeeId: string): Promise<WithdrawResult> {
  notWired("withdraw");
}

export async function getTransactionStatus(_txHash: string): Promise<TxStatus> {
  notWired("getTransactionStatus");
}

export async function getActivity(_filter?: ActivityFilterInput): Promise<ActivityItem[]> {
  notWired("getActivity");
}

export async function previewDeposit(_amount: string): Promise<DepositPreview> {
  notWired("previewDeposit");
}

export async function getStreamPhysics(_employeeId: string): Promise<StreamPhysics> {
  notWired("getStreamPhysics");
}

export async function getFlowGraph(): Promise<FlowNode[]> {
  notWired("getFlowGraph");
}

export async function getTransactionDetail(_txHash: string): Promise<TransactionDetail> {
  notWired("getTransactionDetail");
}

export async function resetDemo(): Promise<void> {
  notWired("resetDemo");
}

export async function getSdkInfo(): Promise<SdkMeta> {
  return getSdkMeta();
}
