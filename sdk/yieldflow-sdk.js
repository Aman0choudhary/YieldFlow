const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const DEFAULT_TOKEN_DECIMALS = 7;

let configuredSdk = null;

export async function configureYieldFlowSdk(options) {
  configuredSdk = await createYieldFlowSdk(options);
  return configuredSdk;
}

export async function createYieldFlowSdk(options) {
  const {
    rpcUrl,
    sourcePublicKey,
    signTransaction,
    tokenDecimals = DEFAULT_TOKEN_DECIMALS,
    networkPassphrase = TESTNET_PASSPHRASE,
    contractIds
  } = options || {};

  if (!rpcUrl) {
    throw new Error("createYieldFlowSdk requires rpcUrl.");
  }
  if (!sourcePublicKey) {
    throw new Error("createYieldFlowSdk requires sourcePublicKey.");
  }
  if (!contractIds?.vault || !contractIds?.streaming) {
    throw new Error("createYieldFlowSdk requires contractIds.vault and contractIds.streaming.");
  }

  const { Client: VaultClient } = await importGeneratedClient("./generated/vault/dist/index.js", "vault");
  const { Client: StreamingClient } = await importGeneratedClient(
    "./generated/streaming/dist/index.js",
    "streaming"
  );

  const clientOptions = {
    networkPassphrase,
    rpcUrl,
    publicKey: sourcePublicKey,
    signTransaction
  };

  const vault = new VaultClient({
    ...clientOptions,
    contractId: contractIds.vault
  });
  const streaming = new StreamingClient({
    ...clientOptions,
    contractId: contractIds.streaming
  });

  return {
    async connectEmployer() {
      return {
        address: sourcePublicKey,
        network: networkPassphrase === TESTNET_PASSPHRASE ? "stellar-testnet" : networkPassphrase,
        connectedAt: new Date().toISOString()
      };
    },

    async depositPayroll(amount) {
      const baseAmount = toBaseUnits(amount, tokenDecimals);
      const tx = await vault.deposit_payroll({ amount: baseAmount });
      const result = await signAndSend(tx);

      return {
        txId: result.hash ?? null,
        status: "success",
        token: "USDC",
        amount: fromBaseUnits(baseAmount, tokenDecimals),
        stats: mapEmployerStats(result.value ?? tx.result, tokenDecimals),
        depositedAt: new Date().toISOString()
      };
    },

    async getEmployerStats() {
      const tx = await vault.stats({ simulate: true });
      return mapEmployerStats(tx.result, tokenDecimals);
    },

    async loginEmployee() {
      throw new Error("loginEmployee is waiting for Passkey Kit integration.");
    },

    async getEmployeeBalance(employeeId) {
      const tx = await streaming.balance({ employee: employeeId }, { simulate: true });
      return mapEmployeeBalance(tx.result, tokenDecimals);
    },

    async withdraw(employeeId) {
      const balanceTx = await streaming.balance({ employee: employeeId }, { simulate: true });
      const balance = balanceTx.result;
      const amount = BigInt(balance.withdrawable_amount ?? 0);

      if (amount <= 0n) {
        return {
          txId: null,
          status: "nothing_to_withdraw",
          token: "USDC",
          amountReceived: 0,
          gasPaidBy: "relayer",
          withdrawnAt: new Date().toISOString()
        };
      }

      const tx = await vault.release_buffer({ recipient: employeeId, amount });
      const result = await signAndSend(tx);

      return {
        txId: result.hash ?? null,
        status: "success",
        token: "USDC",
        amountReceived: fromBaseUnits(amount, tokenDecimals),
        stats: mapEmployerStats(result.value ?? tx.result, tokenDecimals),
        gasPaidBy: "relayer",
        withdrawnAt: new Date().toISOString()
      };
    }
  };
}

export async function connectEmployer() {
  return requireConfiguredSdk("connectEmployer").connectEmployer();
}

export async function depositPayroll(amount) {
  return requireConfiguredSdk("depositPayroll").depositPayroll(amount);
}

export async function getEmployerStats() {
  return requireConfiguredSdk("getEmployerStats").getEmployerStats();
}

export async function loginEmployee() {
  return requireConfiguredSdk("loginEmployee").loginEmployee();
}

export async function getEmployeeBalance(employeeId) {
  return requireConfiguredSdk("getEmployeeBalance").getEmployeeBalance(employeeId);
}

export async function withdraw(employeeId) {
  return requireConfiguredSdk("withdraw").withdraw(employeeId);
}

function requireConfiguredSdk(functionName) {
  if (!configuredSdk) {
    throw new Error(`${functionName} requires configureYieldFlowSdk(options) to be called first.`);
  }
  return configuredSdk;
}

async function importGeneratedClient(path, name) {
  try {
    return await import(path);
  } catch (error) {
    throw new Error(
      `Missing generated ${name} client build. Run npm.cmd install and npm.cmd run build inside sdk/generated/${name}. Original error: ${error.message}`
    );
  }
}

async function signAndSend(assembledTransaction) {
  if (typeof assembledTransaction.signAndSend !== "function") {
    throw new Error("Generated Stellar transaction does not expose signAndSend().");
  }

  const response = await assembledTransaction.signAndSend();
  return {
    hash: response.hash ?? response.txHash ?? response.id ?? null,
    value: response.result ?? assembledTransaction.result
  };
}

function mapEmployerStats(stats, tokenDecimals) {
  return {
    token: "USDC",
    network: "stellar-testnet",
    totalPool: fromBaseUnits(stats?.total_pool ?? 0, tokenDecimals),
    totalDeposited: fromBaseUnits(stats?.total_deposited ?? 0, tokenDecimals),
    yieldEarned: 0,
    yieldApy: 0,
    bufferStatus: {
      available: fromBaseUnits(stats?.buffer_balance ?? 0, tokenDecimals),
      targetRatio: Number(stats?.buffer_bps ?? 0) / 10000,
      currentRatio: ratio(stats?.buffer_balance ?? 0, stats?.total_pool ?? 0),
      status: stats?.buffer_healthy ? "healthy" : "rebalance_needed"
    },
    activeEmployees: 0,
    updatedAt: new Date().toISOString()
  };
}

function mapEmployeeBalance(balance, tokenDecimals) {
  return {
    employeeId: balance.employee,
    token: "USDC",
    unlockedAmount: fromBaseUnits(balance.unlocked_amount, tokenDecimals),
    withdrawnAmount: fromBaseUnits(balance.withdrawn_amount, tokenDecimals),
    withdrawableAmount: fromBaseUnits(balance.withdrawable_amount, tokenDecimals),
    ratePerSecond: fromBaseUnits(balance.rate_per_second, tokenDecimals),
    streamTotal: fromBaseUnits(balance.total_amount, tokenDecimals),
    streamStartedAt: timestampToIso(balance.start_time),
    streamEndsAt: timestampToIso(balance.end_time),
    updatedAt: timestampToIso(balance.updated_at)
  };
}

function toBaseUnits(amount, decimals) {
  const value = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error("Amount must be a positive decimal number.");
  }

  const [whole, fraction = ""] = value.split(".");
  const scale = 10n ** BigInt(decimals);
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  return BigInt(whole) * scale + BigInt(paddedFraction || "0");
}

function fromBaseUnits(value, decimals) {
  return Number(BigInt(value ?? 0)) / 10 ** decimals;
}

function ratio(numerator, denominator) {
  const bottom = BigInt(denominator ?? 0);
  if (bottom === 0n) return 0;
  return Number(BigInt(numerator ?? 0)) / Number(bottom);
}

function timestampToIso(timestamp) {
  const seconds = Number(timestamp ?? 0);
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

export const sdk = {
  configureYieldFlowSdk,
  createYieldFlowSdk,
  connectEmployer,
  depositPayroll,
  getEmployerStats,
  loginEmployee,
  getEmployeeBalance,
  withdraw
};

export default sdk;
