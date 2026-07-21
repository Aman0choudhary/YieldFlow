/**
 * YieldFlow network / deployment config (Phase 3).
 * Contract IDs can be set in this file or via Vite env at build time.
 */
export type YieldFlowNetworkConfig = {
  network: "testnet" | "mainnet" | "mock";
  horizonUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  asset: {
    code: string;
    issuer: string;
    tokenContractId: string;
  };
  contracts: {
    vault: string | null;
    streaming: string | null;
    defindexRouter: string | null;
  };
  accounts: {
    deployer: string;
    employer: string;
    employee: string;
  };
  sourcePublicKey: string | null;
};

function readEnv(key: string): string | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.[key];
  } catch {
    return undefined;
  }
}

function envContract(key: string): string | null {
  const value = readEnv(key)?.trim();
  return value && value.length > 8 ? value : null;
}

/** Static defaults — overridden by VITE_* contract ids when present. */
export const TESTNET_CONFIG: YieldFlowNetworkConfig = {
  network: "testnet",
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  asset: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    tokenContractId: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  },
  contracts: {
    vault: envContract("VITE_VAULT_CONTRACT_ID"),
    streaming: envContract("VITE_STREAMING_CONTRACT_ID"),
    defindexRouter: envContract("VITE_DEFINDEX_CONTRACT_ID"),
  },
  accounts: {
    deployer: "GCAB3VW5QQPZTQ4L63HP66JMDNJEYQNXEES72JUDOHXD4XJWIYF2N4WI",
    employer: "GDIPYV4FKF7WWB45NWT52RESKJ2TRCKGBMVH7R64K2L6PXQDEMF7QOTI",
    employee: "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4",
  },
  sourcePublicKey:
    envContract("VITE_SOURCE_PUBLIC_KEY") ??
    "GDIPYV4FKF7WWB45NWT52RESKJ2TRCKGBMVH7R64K2L6PXQDEMF7QOTI",
};

export type SdkMode = "mock" | "stellar";

export type SdkMeta = {
  mode: SdkMode;
  network: string;
  ready: boolean;
  reason?: string;
  contracts: YieldFlowNetworkConfig["contracts"];
};

export function contractsReady(config: YieldFlowNetworkConfig = TESTNET_CONFIG): boolean {
  return Boolean(config.contracts.vault && config.contracts.streaming);
}

export function resolveSdkMode(raw?: string | null): SdkMode {
  const value = (raw ?? "mock").toLowerCase();
  return value === "stellar" ? "stellar" : "mock";
}

export function applyContractIds(ids: {
  vault?: string | null;
  streaming?: string | null;
  defindexRouter?: string | null;
}): YieldFlowNetworkConfig {
  TESTNET_CONFIG.contracts.vault = ids.vault ?? TESTNET_CONFIG.contracts.vault;
  TESTNET_CONFIG.contracts.streaming = ids.streaming ?? TESTNET_CONFIG.contracts.streaming;
  TESTNET_CONFIG.contracts.defindexRouter =
    ids.defindexRouter ?? TESTNET_CONFIG.contracts.defindexRouter;
  return TESTNET_CONFIG;
}
