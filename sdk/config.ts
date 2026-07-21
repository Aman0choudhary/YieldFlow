/**
 * YieldFlow network / deployment config (Phase 3).
 * Loaded by stellar-sdk and surface metadata for the UI.
 * Contract IDs stay empty until scripts/deploy-testnet.ps1 succeeds.
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
};

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
    vault: null,
    streaming: null,
    defindexRouter: null,
  },
  accounts: {
    deployer: "GCAB3VW5QQPZTQ4L63HP66JMDNJEYQNXEES72JUDOHXD4XJWIYF2N4WI",
    employer: "GDIPYV4FKF7WWB45NWT52RESKJ2TRCKGBMVH7R64K2L6PXQDEMF7QOTI",
    employee: "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4",
  },
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
