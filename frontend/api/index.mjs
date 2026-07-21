/**
 * YieldFlow Backend â€” Vercel Serverless Function
 */

let stellarSdk;
let Contract, TransactionBuilder, rpc, Address, nativeToScVal, scValToNative, Keypair;

// Lazy-load stellar-sdk to catch import errors gracefully
async function ensureSdk() {
  if (stellarSdk) return;
  try {
    stellarSdk = await import("@stellar/stellar-sdk");
    // stellar-sdk v12+ exports rpc; older aliases used SorobanRpc
    const rpcNs = stellarSdk.rpc || stellarSdk.SorobanRpc;
    if (!rpcNs || !rpcNs.Server) {
      throw new Error("@stellar/stellar-sdk missing rpc.Server export");
    }
    rpc = rpcNs;
    ({ Keypair, Contract, TransactionBuilder, Address, nativeToScVal, scValToNative } = stellarSdk);
    if (!Contract || !TransactionBuilder || !Keypair) {
      throw new Error("@stellar/stellar-sdk missing core exports");
    }
  } catch (err) {
    throw new Error(`Failed to load @stellar/stellar-sdk: ${err.message}`);
  }
}

/* â”€â”€ Token helpers (7-decimal USDC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TOKEN_DECIMALS = 7;
const DEFAULT_WITHDRAW_UNITS = 1000n;

function normalizeAmount(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Amount must be a positive decimal number.");
  }
  return normalized;
}

function toBaseUnits(amount) {
  const value = normalizeAmount(amount);
  const [whole, fraction = ""] = value.split(".");
  const scale = 10n ** BigInt(TOKEN_DECIMALS);
  const paddedFraction = `${fraction}${"0".repeat(TOKEN_DECIMALS)}`.slice(0, TOKEN_DECIMALS);
  return BigInt(whole) * scale + BigInt(paddedFraction || "0");
}

function fromBaseUnits(value) {
  const raw = BigInt(value || 0);
  const scale = 10n ** BigInt(TOKEN_DECIMALS);
  const whole = raw / scale;
  const fraction = String(raw % scale).padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function formatNextPayday(endTime) {
  const seconds = Number(endTime || 0) - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return "Complete";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/* â”€â”€ Soroban contract client â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const BASE_FEE = "1000000";

function createContractClient({ contractId, rpcUrl, networkPassphrase, publicKey, keypair }) {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  return {
    async simulate(method, args = []) {
      const account = await server.getAccount(publicKey);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed: ${sim.error || "unknown error"}`);
      }

      const retval = sim.result?.retval;
      if (!retval) return null;
      return scValToNative(retval);
    },

    async execute(method, args = []) {
      if (!keypair) {
        throw Object.assign(
          new Error("YIELDFLOW_SIGNER_SECRET is required for state-changing actions."),
          { statusCode: 503 }
        );
      }

      const account = await server.getAccount(keypair.publicKey());
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed: ${sim.error || "unknown error"}`);
      }

      const prepared = rpc.assembleTransaction(tx, sim).build();
      prepared.sign(keypair);

      const sendResult = await server.sendTransaction(prepared);
      if (sendResult.status === "ERROR") {
        throw new Error(`Transaction send failed: ${sendResult.errorResult || "unknown"}`);
      }

      const hash = sendResult.hash;
      let txStatus = sendResult;
      for (let i = 0; i < 30; i++) {
        if (txStatus.status !== "PENDING" && txStatus.status !== "NOT_FOUND") break;
        await new Promise((r) => setTimeout(r, 2000));
        txStatus = await server.getTransaction(hash);
      }

      let result = null;
      if (txStatus.status === "SUCCESS" && txStatus.returnValue) {
        result = scValToNative(txStatus.returnValue);
      }

      return { hash, result, status: txStatus.status };
    },
  };
}

function toI128(value) {
  return nativeToScVal(BigInt(value), { type: "i128" });
}

function toAddr(addr) {
  return new Address(addr).toScVal();
}

/* â”€â”€ Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const config = {
  rpcUrl: process.env.YIELDFLOW_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.YIELDFLOW_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  allowedOrigin: process.env.YIELDFLOW_ALLOWED_ORIGIN || "*",
  signerSecret: process.env.YIELDFLOW_SIGNER_SECRET || "",
  publicKey: process.env.YIELDFLOW_PUBLIC_KEY || "GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM",
  vaultContractId: process.env.YIELDFLOW_VAULT_CONTRACT_ID || "CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B",
  streamingContractId: process.env.YIELDFLOW_STREAMING_CONTRACT_ID || "CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU",
  employeeAddress: process.env.YIELDFLOW_EMPLOYEE_ADDRESS || "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4",
};

/* â”€â”€ Lazy-initialized clients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

let vault = null;
let streaming = null;
let signerKeypair = null;
let publicKey = null;
const txStatuses = new Map();

function initClients() {
  if (vault) return; // already initialized

  signerKeypair =
    config.signerSecret && !config.signerSecret.startsWith("SBXXX")
      ? Keypair.fromSecret(config.signerSecret)
      : null;

  publicKey = signerKeypair?.publicKey() || config.publicKey;

  const clientOpts = {
    rpcUrl: config.rpcUrl,
    networkPassphrase: config.networkPassphrase,
    publicKey,
    keypair: signerKeypair,
  };

  vault = createContractClient({ ...clientOpts, contractId: config.vaultContractId });
  streaming = createContractClient({ ...clientOpts, contractId: config.streamingContractId });
}

/* â”€â”€ HTTP helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function setCors(res) {
  res.setHeader("access-control-allow-origin", config.allowedOrigin);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function sendJson(res, body, statusCode = 200) {
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function requireSigner() {
  if (!signerKeypair) {
    throw Object.assign(
      new Error("YIELDFLOW_SIGNER_SECRET is required for state-changing actions."),
      { statusCode: 503 }
    );
  }
}

function mapStats(stats) {
  return {
    totalPool: fromBaseUnits(stats?.total_pool || 0),
    yieldEarned: "0",
    bufferAmount: fromBaseUnits(stats?.buffer_balance || 0),
    bufferPercent: Number(stats?.buffer_bps || 0) / 100,
    yieldRoutePercent: Number(stats?.yield_bps || 0) / 100,
    activeEmployees: 1,
    projectedApy: "0.0",
  };
}

function mapBalance(balance) {
  return {
    unlockedAmount: fromBaseUnits(balance?.unlocked_amount || 0),
    ratePerSecond: fromBaseUnits(balance?.rate_per_second || 0),
    totalStreamed: fromBaseUnits(balance?.withdrawn_amount || 0),
    streamCap: fromBaseUnits(balance?.total_amount || 0),
    nextPayday: formatNextPayday(balance?.end_time),
  };
}

/* â”€â”€ Vercel handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function resolveApiPath(req, url) {
  const headerCandidates = [
    req.headers["x-invoke-path"],
    req.headers["x-forwarded-uri"],
    req.headers["x-vercel-original-path"],
    req.headers["x-matched-path"],
  ].filter(Boolean);

  for (const candidate of headerCandidates) {
    if (typeof candidate === "string") {
      const clean = candidate.split("?")[0];
      if (clean === "/api" || clean.startsWith("/api/")) {
        return clean.replace(/\/$/, "") || "/api";
      }
    }
  }

  let path = url.pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  if ((path === "/api" || path === "/") && url.searchParams.has("path")) {
    const p = String(url.searchParams.get("path") || "").replace(/^\/+/, "");
    return p.startsWith("api/") ? `/${p}` : `/api/${p}`;
  }

  const raw = String(req.url || "");
  const rawPath = raw.split("?")[0];
  if (rawPath.startsWith("/api/")) {
    return rawPath.replace(/\/$/, "") || "/api";
  }

  // Catch-all may receive paths without /api prefix
  if (path && path !== "/" && !path.startsWith("/api")) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return (`/api${normalized}`).replace(/\/$/, "") || "/api";
  }

  return path || "/api";
}

export default async function handler(req, res) {
  try {
    setCors(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = resolveApiPath(req, url);

    /* â”€â”€ Health (no stellar-sdk needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/health") {
      return sendJson(res, {
        ok: true,
        network: "stellar-testnet",
        vaultContractId: config.vaultContractId,
        streamingContractId: config.streamingContractId,
      });
    }

    /* â”€â”€ Root (no stellar-sdk needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (path === "/" || path === "") {
      return sendJson(res, {
        name: "YieldFlow Backend",
        version: "0.1.0",
        network: "stellar-testnet",
        endpoints: [
          "GET /api/health",
          "GET /api/stats",
          "GET /api/employer",
          "GET /api/employee/balance?employeeId=...",
          "POST /api/deposit",
          "POST /api/withdraw",
        ],
      });
    }

    // All routes below need the Stellar SDK
    await ensureSdk();
    initClients();

    /* â”€â”€ Employer connect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/employer") {
      return sendJson(res, {
        address: publicKey,
        network: "stellar-testnet",
        connectedAt: new Date().toISOString(),
      });
    }

    /* â”€â”€ Vault stats (read-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/stats") {
      const result = await vault.simulate("stats");
      return sendJson(res, mapStats(result));
    }

    /* â”€â”€ Activity feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/activity") {
      return sendJson(res, [
        { id: "deploy", kind: "yield", label: "Contracts deployed", timestamp: "Testnet", amount: "Live" },
        { id: "deposit-smoke", kind: "deposit", label: "Smoke deposit", timestamp: "Testnet", amount: "+10 USDC" },
        { id: "withdraw-smoke", kind: "withdraw", label: "Smoke withdrawal", timestamp: "Testnet", amount: "-0.0001 USDC" },
      ]);
    }

    /* â”€â”€ Employee session restore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/employee/session") {
      return sendJson(res, { employeeId: config.employeeAddress });
    }

    /* â”€â”€ Employee login (demo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "POST" && path === "/api/employee/login") {
      return sendJson(res, {
        employeeId: config.employeeAddress,
        name: "Test Employee",
        walletAddress: config.employeeAddress,
      });
    }

    /* â”€â”€ Employee balance (read-only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/employee/balance") {
      const employee = url.searchParams.get("employeeId") || config.employeeAddress;
      const result = await streaming.simulate("balance", [toAddr(employee)]);
      return sendJson(res, mapBalance(result));
    }

    /* â”€â”€ Transaction status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "GET" && path === "/api/tx/status") {
      const txHash = url.searchParams.get("txHash") || "";
      return sendJson(res, { status: txStatuses.get(txHash) || "confirmed" });
    }

    /* â”€â”€ Deposit payroll (state-changing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "POST" && path === "/api/deposit") {
      requireSigner();
      const body = await readBody(req);
      const amount = normalizeAmount(body.amount || "1");
      const amountUnits = toBaseUnits(amount);

      const { hash, result } = await vault.execute("deposit_payroll", [toI128(amountUnits)]);
      if (hash) txStatuses.set(hash, "confirmed");

      return sendJson(res, {
        txHash: hash || `deposit_${Date.now()}`,
        status: "confirmed",
        amount,
        stats: result ? mapStats(result) : null,
      });
    }

    /* â”€â”€ Withdraw (state-changing) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if (req.method === "POST" && path === "/api/withdraw") {
      requireSigner();
      const body = await readBody(req);
      const employee = body.employeeId || config.employeeAddress;

      const balance = await streaming.simulate("balance", [toAddr(employee)]);
      const withdrawable = BigInt(balance?.withdrawable_amount || 0);

      if (withdrawable <= 0n) {
        return sendJson(res, {
          txHash: `withdraw_${Date.now()}`,
          status: "failed",
          amountReceived: "0",
        });
      }

      const amount = withdrawable < DEFAULT_WITHDRAW_UNITS ? withdrawable : DEFAULT_WITHDRAW_UNITS;
      const { hash, result } = await vault.execute("release_buffer", [
        toAddr(employee),
        toI128(amount),
      ]);
      if (hash) txStatuses.set(hash, "confirmed");

      return sendJson(res, {
        txHash: hash || `withdraw_${Date.now()}`,
        status: "confirmed",
        amountReceived: fromBaseUnits(amount),
        stats: result ? mapStats(result) : null,
      });
    }

    /* â”€â”€ 404 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Request error:", error);
    const status = error.statusCode || 500;
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: error.message || String(error) }));
  }
}
