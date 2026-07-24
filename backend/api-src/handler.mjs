/**
 * YieldFlow Backend — Vercel Serverless + local Node
 * Real Soroban vault/streaming + Blend pool stats (testnet).
 */

import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { createServer } from "node:http";

let stellarSdk;
let Contract, TransactionBuilder, rpc, Address, nativeToScVal, scValToNative, Keypair, xdr;

async function ensureSdk() {
  if (stellarSdk) return;
  stellarSdk = await import("@stellar/stellar-sdk");
  const rpcNs = stellarSdk.rpc || stellarSdk.SorobanRpc;
  if (!rpcNs?.Server) throw new Error("@stellar/stellar-sdk missing rpc.Server");
  rpc = rpcNs;
  ({ Keypair, Contract, TransactionBuilder, Address, nativeToScVal, scValToNative, xdr } = stellarSdk);
}

const TOKEN_DECIMALS = 7;
const SCALAR_12 = 1_000_000_000_000n;
const SCALAR_7 = 10_000_000n;
const BASE_FEE = "1000000";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const config = {
  port: Number(process.env.PORT || process.env.YIELDFLOW_API_PORT || 8787),
  rpcUrl: process.env.YIELDFLOW_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.YIELDFLOW_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  allowedOrigin: process.env.YIELDFLOW_ALLOWED_ORIGIN || "*",
  signerSecret: process.env.YIELDFLOW_SIGNER_SECRET || "",
  publicKey: process.env.YIELDFLOW_PUBLIC_KEY || "GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM",
  vaultContractId:
    process.env.YIELDFLOW_VAULT_CONTRACT_ID || "CDVT3Y47BTCZ2GLV4JJQTPGGFPJEXXM4BRJLLQIEZRVKRCNPO3M7CBVX",
  streamingContractId:
    process.env.YIELDFLOW_STREAMING_CONTRACT_ID || "CCF4CYV2K7EVOP46UU7ZLS7Z3LEZKT5OIVCOQPGK6DKW7RWGUW6SESOS",
  blendPoolId:
    process.env.YIELDFLOW_BLEND_POOL_ID || "CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW",
  tokenContractId:
    process.env.YIELDFLOW_TOKEN_CONTRACT_ID || "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  employeeAddress:
    process.env.YIELDFLOW_EMPLOYEE_ADDRESS || "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4",
  sessionSecret:
    process.env.YIELDFLOW_SESSION_SECRET ||
    process.env.YIELDFLOW_SIGNER_SECRET ||
    "yieldflow-testnet-session-dev-only",
  networkLabel: process.env.YIELDFLOW_NETWORK_LABEL || "stellar-testnet",
};

const activity = [];
const txStatuses = new Map();
let vault = null;
let streaming = null;
let blend = null;
let token = null;
let signerKeypair = null;
let publicKey = null;

function normalizeAmount(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Amount must be a positive decimal number.");
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
  const raw = BigInt(value ?? 0);
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

function setCors(res) {
  res.setHeader("access-control-allow-origin", config.allowedOrigin);
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
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

function humanizeChainError(error) {
  const msg = error?.message || String(error || "");
  if (/not within the allowed range|insufficient/i.test(msg)) {
    return Object.assign(new Error("Insufficient testnet USDC on employer/signer account. Top up via Circle faucet."), { statusCode: 400 });
  }
  if (/YIELDFLOW_SIGNER_SECRET/i.test(msg)) {
    return Object.assign(new Error(msg), { statusCode: 503 });
  }
  return error;
}

function requireSigner() {
  if (!signerKeypair) {
    throw Object.assign(new Error("YIELDFLOW_SIGNER_SECRET is required for state-changing actions."), {
      statusCode: 503,
    });
  }
}

function pushActivity(item) {
  activity.unshift({
    id: item.id || `${item.kind}_${Date.now()}`,
    kind: item.kind,
    label: item.label,
    timestamp: item.timestamp || new Date().toISOString(),
    amount: item.amount,
  });
  if (activity.length > 50) activity.length = 50;
}

function createContractClient({ contractId, rpcUrl, networkPassphrase, publicKey, keypair }) {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);
  return {
    async simulate(method, args = []) {
      const account = await server.getAccount(publicKey);
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(contract.call(method, ...args))
        .setTimeout(60)
        .build();
      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed (${method}): ${sim.error || "unknown"}`);
      }
      const retval = sim.result?.retval;
      return retval ? scValToNative(retval) : null;
    },
    async execute(method, args = []) {
      if (!keypair) {
        throw Object.assign(new Error("YIELDFLOW_SIGNER_SECRET is required for state-changing actions."), {
          statusCode: 503,
        });
      }
      const account = await server.getAccount(keypair.publicKey());
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(contract.call(method, ...args))
        .setTimeout(60)
        .build();
      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed (${method}): ${sim.error || "unknown"}`);
      }
      const prepared = rpc.assembleTransaction(tx, sim).build();
      prepared.sign(keypair);
      const sendResult = await server.sendTransaction(prepared);
      if (sendResult.status === "ERROR") {
        throw new Error(`Transaction send failed: ${sendResult.errorResult || "unknown"}`);
      }
      const hash = sendResult.hash;
      let txStatus = sendResult;
      for (let i = 0; i < 40; i++) {
        if (txStatus.status !== "PENDING" && txStatus.status !== "NOT_FOUND") break;
        await new Promise((r) => setTimeout(r, 1500));
        txStatus = await server.getTransaction(hash);
      }
      let result = null;
      if (txStatus.status === "SUCCESS" && txStatus.returnValue) {
        result = scValToNative(txStatus.returnValue);
      }
      if (txStatus.status && txStatus.status !== "SUCCESS" && txStatus.status !== "PENDING") {
        // still return hash for debugging
      }
      return { hash, result, status: txStatus.status || sendResult.status };
    },
  };
}

function toI128(value) {
  return nativeToScVal(BigInt(value), { type: "i128" });
}
function toAddr(addr) {
  return new Address(addr).toScVal();
}
function toU64(value) {
  return nativeToScVal(BigInt(value), { type: "u64" });
}

function initClients() {
  if (vault) return;
  signerKeypair =
    config.signerSecret && !String(config.signerSecret).startsWith("SBXXX")
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
  blend = createContractClient({ ...clientOpts, contractId: config.blendPoolId });
  token = createContractClient({ ...clientOpts, contractId: config.tokenContractId });
}

function issueSession(employeeId) {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${employeeId}.${exp}`;
  const sig = createHmac("sha256", config.sessionSecret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function verifySession(token, expectedEmployee) {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return false;
    const [employeeId, expStr, sig] = parts;
    if (expectedEmployee && employeeId !== expectedEmployee) return false;
    if (Date.now() > Number(expStr)) return false;
    const payload = `${employeeId}.${expStr}`;
    const expected = createHmac("sha256", config.sessionSecret).update(payload).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    return employeeId;
  } catch {
    return false;
  }
}

function getBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof h === "string" && h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return "";
}

function isAllowedEmployee(address) {
  const allow = String(process.env.YIELDFLOW_EMPLOYEE_ALLOWLIST || config.employeeAddress)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(address);
}

/** Approximate Blend supply APY from reserve IR curve (7-decimal params). */
function estimateSupplyApy(reserve) {
  if (!reserve?.config || !reserve?.data) return 0;
  const c = reserve.config;
  const d = reserve.data;
  const util = Number(d.d_supply || 0) === 0
    ? 0
    : Number((BigInt(d.d_supply || 0) * SCALAR_7) / (BigInt(d.b_supply || 1) > 0n ? BigInt(d.b_supply) : 1n)) / 1e7;
  // Use config util target if on-chain util unavailable from supplies ratio
  const u = Math.min(0.99, Math.max(0, Number(c.util || 0) / 1e7));
  const rBase = Number(c.r_base || 0) / 1e7;
  const rOne = Number(c.r_one || 0) / 1e7;
  const rTwo = Number(c.r_two || 0) / 1e7;
  const rThree = Number(c.r_three || 0) / 1e7;
  // Simplified kink model around target util
  let borrow = rBase;
  if (u <= Number(c.util || 0) / 1e7) {
    const t = Number(c.util || 1) / 1e7 || 1;
    borrow = rBase + rOne * (u / t);
  } else {
    const t = Number(c.util || 1) / 1e7 || 1;
    const maxU = Number(c.max_util || 1e7) / 1e7 || 1;
    borrow = rBase + rOne + rTwo * ((u - t) / Math.max(1e-9, maxU - t));
    if (u > 0.95) borrow += rThree * ((u - 0.95) / 0.05);
  }
  // supply ≈ borrow * utilization * (1 - 10% backstop take rough)
  const supply = borrow * u * 0.9;
  return Math.max(0, supply * 100);
}

async function liveBlendValue(yieldPrincipalBase) {
  try {
    const positions = await blend.simulate("get_positions", [toAddr(config.vaultContractId)]);
    const supplyMap = positions?.supply || {};
    // reserve index may be number or string keys
    let shares = 0n;
    for (const k of Object.keys(supplyMap)) {
      shares += BigInt(supplyMap[k] || 0);
    }
    if (shares <= 0n) {
      return { liveValue: BigInt(yieldPrincipalBase || 0), shares: 0n, apy: 0 };
    }
    const reserve = await blend.simulate("get_reserve", [toAddr(config.tokenContractId)]);
    const bRate = BigInt(reserve?.data?.b_rate || SCALAR_12);
    const liveValue = (shares * bRate) / SCALAR_12;
    const apy = estimateSupplyApy(reserve);
    return { liveValue, shares, apy, reserve };
  } catch (e) {
    return { liveValue: BigInt(yieldPrincipalBase || 0), shares: 0n, apy: 0, error: String(e.message || e) };
  }
}

async function mapStats(stats) {
  const yieldPrincipal = BigInt(stats?.yield_principal || 0);
  const buffer = BigInt(stats?.buffer_balance || 0);
  const blendLive = await liveBlendValue(yieldPrincipal);
  const liveYield = blendLive.liveValue;
  const yieldEarned = liveYield > yieldPrincipal ? liveYield - yieldPrincipal : 0n;
  const totalPool = buffer + liveYield;
  return {
    totalPool: fromBaseUnits(totalPool),
    yieldEarned: fromBaseUnits(yieldEarned),
    bufferAmount: fromBaseUnits(buffer),
    yieldPrincipal: fromBaseUnits(yieldPrincipal),
    yieldLiveValue: fromBaseUnits(liveYield),
    bufferPercent: Number(stats?.buffer_bps || 0) / 100,
    yieldRoutePercent: Number(stats?.yield_bps || 0) / 100,
    activeEmployees: 1,
    projectedApy: blendLive.apy ? blendLive.apy.toFixed(2) : "0.00",
    blendEnabled: Boolean(stats?.blend_enabled),
    blendPoolId: config.blendPoolId,
    totalDeposited: fromBaseUnits(stats?.total_deposited || 0),
    totalReleased: fromBaseUnits(stats?.total_released || 0),
  };
}

function mapBalance(balance) {
  return {
    unlockedAmount: fromBaseUnits(balance?.unlocked_amount || 0),
    ratePerSecond: fromBaseUnits(balance?.rate_per_second || 0),
    totalStreamed: fromBaseUnits(balance?.withdrawn_amount || 0),
    streamCap: fromBaseUnits(balance?.total_amount || 0),
    withdrawableAmount: fromBaseUnits(balance?.withdrawable_amount || 0),
    nextPayday: formatNextPayday(balance?.end_time),
    startTime: Number(balance?.start_time || 0),
    endTime: Number(balance?.end_time || 0),
  };
}

function resolveApiPath(req, url) {
  const headerCandidates = [
    req.headers?.["x-invoke-path"],
    req.headers?.["x-forwarded-uri"],
    req.headers?.["x-vercel-original-path"],
    req.headers?.["x-matched-path"],
  ].filter(Boolean);
  for (const candidate of headerCandidates) {
    if (typeof candidate === "string") {
      const clean = candidate.split("?")[0];
      if (clean === "/api" || clean.startsWith("/api/")) return clean.replace(/\/$/, "") || "/api";
    }
  }
  let path = url.pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  // Vercel rewrite sometimes lands on /api with ?path=
  if (path === "/api" && url.searchParams.get("path")) {
    path = `/api/${url.searchParams.get("path")}`.replace(/\/$/, "");
  }
  return path;
}

export async function handleRequest(req, res) {
  try {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = resolveApiPath(req, url);

    if (req.method === "GET" && (path === "/api/health" || path === "/api")) {
      return sendJson(res, {
        ok: true,
        network: config.networkLabel,
        vaultContractId: config.vaultContractId,
        streamingContractId: config.streamingContractId,
        blendPoolId: config.blendPoolId,
        signerConfigured: Boolean(config.signerSecret && !String(config.signerSecret).startsWith("SBXXX")),
      });
    }

    if (path === "/" || path === "") {
      return sendJson(res, {
        name: "YieldFlow Backend",
        version: "0.2.0",
        network: config.networkLabel,
      });
    }

    await ensureSdk();
    initClients();

    if (req.method === "GET" && path === "/api/employer") {
      return sendJson(res, {
        address: publicKey,
        network: config.networkLabel,
        connectedAt: new Date().toISOString(),
        vaultContractId: config.vaultContractId,
        blendPoolId: config.blendPoolId,
      });
    }

    if (req.method === "GET" && path === "/api/stats") {
      const result = await vault.simulate("stats");
      return sendJson(res, await mapStats(result));
    }

    if (req.method === "GET" && path === "/api/activity") {
      return sendJson(res, activity);
    }

    if (req.method === "GET" && path === "/api/employee/session") {
      const token = getBearer(req);
      const employeeId = verifySession(token, null);
      if (!employeeId) return sendJson(res, { employeeId: null });
      return sendJson(res, { employeeId });
    }

    if (req.method === "POST" && path === "/api/employee/login") {
      const body = await readBody(req);
      const employeeId = body.employeeId || config.employeeAddress;
      if (!isAllowedEmployee(employeeId)) {
        return sendJson(res, { error: "Employee not authorized for this deployment." }, 403);
      }
      // Testnet MVP: allowlisted employee session (real Passkey Kit can replace this later).
      const sessionToken = issueSession(employeeId);
      pushActivity({
        kind: "auth",
        label: "Employee session issued",
        amount: employeeId.slice(0, 6) + "…",
      });
      return sendJson(res, {
        employeeId,
        name: body.name || "Testnet Employee",
        walletAddress: employeeId,
        sessionToken,
        authMethod: "allowlist-session",
      });
    }

    if (req.method === "GET" && path === "/api/employee/balance") {
      const employee = url.searchParams.get("employeeId") || config.employeeAddress;
      const result = await streaming.simulate("balance", [toAddr(employee)]);
      return sendJson(res, mapBalance(result));
    }

    if (req.method === "GET" && path === "/api/tx/status") {
      const txHash = url.searchParams.get("txHash") || "";
      return sendJson(res, { status: txStatuses.get(txHash) || "confirmed" });
    }

    if (req.method === "POST" && path === "/api/deposit") {
      requireSigner();
      const body = await readBody(req);
      const amount = normalizeAmount(body.amount || "10");
      const amountUnits = toBaseUnits(amount);
      const { hash, result, status } = await vault.execute("deposit_payroll", [toI128(amountUnits)]);
      if (hash) txStatuses.set(hash, status === "SUCCESS" ? "confirmed" : String(status || "pending"));
      pushActivity({
        id: hash || `deposit_${Date.now()}`,
        kind: "deposit",
        label: "Payroll deposited (buffer + Blend)",
        amount: `+${amount} USDC`,
      });
      return sendJson(res, {
        txHash: hash || `deposit_${Date.now()}`,
        status: status === "SUCCESS" ? "confirmed" : String(status || "pending"),
        amount,
        stats: result ? await mapStats(result) : null,
      });
    }

    if (req.method === "POST" && path === "/api/stream/create") {
      requireSigner();
      const body = await readBody(req);
      const employee = body.employeeId || config.employeeAddress;
      if (!isAllowedEmployee(employee)) {
        return sendJson(res, { error: "Employee not on allowlist." }, 403);
      }
      try {
        const existing = await streaming.simulate("balance", [toAddr(employee)]);
        const total = BigInt(existing?.total_amount || 0);
        if (total > 0n) {
          return sendJson(res, {
            approved: true,
            status: "confirmed",
            message: "Stream already exists on-chain.",
            employeeId: employee,
            balance: mapBalance(existing),
          });
        }
      } catch {
        // create below
      }
      const amountHuman = normalizeAmount(body.totalAmount || "50");
      const amountUnits = toBaseUnits(amountHuman);
      const durationDays = Math.max(1, Number(body.durationDays || 30));
      // Align to ~ledger: use slightly past start so unlock begins immediately.
      const nowSec = Math.floor(Date.now() / 1000) - 7200;
      const start = nowSec;
      const end = nowSec + durationDays * 24 * 60 * 60;
      const { hash, status } = await streaming.execute("create_stream", [
        toAddr(employee),
        toI128(amountUnits),
        toU64(start),
        toU64(end),
      ]);
      if (hash) txStatuses.set(hash, status === "SUCCESS" ? "confirmed" : String(status || "pending"));
      pushActivity({
        id: hash || `stream_${Date.now()}`,
        kind: "stream",
        label: "Employee stream authorized",
        amount: `${amountHuman} USDC / ${durationDays}d`,
      });
      return sendJson(res, {
        approved: true,
        status: status === "SUCCESS" ? "confirmed" : String(status || "pending"),
        txHash: hash || `stream_${Date.now()}`,
        message: "Stream created on-chain.",
        employeeId: employee,
      });
    }

    if (req.method === "POST" && path === "/api/withdraw") {
      requireSigner();
      const body = await readBody(req);
      const employee = body.employeeId || config.employeeAddress;
      const session = verifySession(getBearer(req), employee);
      // Allow withdraw if session matches OR (testnet) if no session header but employee is allowlisted and body flag demo — still require allowlist.
      if (!session && !isAllowedEmployee(employee)) {
        return sendJson(res, { error: "Unauthorized employee withdraw." }, 401);
      }
      if (getBearer(req) && !session) {
        return sendJson(res, { error: "Invalid or expired session." }, 401);
      }

      const balance = await streaming.simulate("balance", [toAddr(employee)]);
      const withdrawable = BigInt(balance?.withdrawable_amount || 0);
      if (withdrawable <= 0n) {
        return sendJson(res, {
          txHash: `withdraw_${Date.now()}`,
          status: "failed",
          amountReceived: "0",
          error: "Nothing unlocked to withdraw yet.",
        });
      }

      // Full unlocked amount (no smoke 0.0001 cap). Optional body.amount to withdraw less.
      let amount = withdrawable;
      if (body.amount) {
        const requested = toBaseUnits(normalizeAmount(body.amount));
        if (requested > 0n && requested < amount) amount = requested;
      }

      const { hash, result, status } = await vault.execute("release_buffer", [
        toAddr(employee),
        toI128(amount),
      ]);
      if (hash) txStatuses.set(hash, status === "SUCCESS" ? "confirmed" : String(status || "pending"));
      const received = fromBaseUnits(amount);
      pushActivity({
        id: hash || `withdraw_${Date.now()}`,
        kind: "withdraw",
        label: "Employee withdrawal",
        amount: `-${received} USDC`,
      });
      return sendJson(res, {
        txHash: hash || `withdraw_${Date.now()}`,
        status: status === "SUCCESS" ? "confirmed" : String(status || "pending"),
        amountReceived: received,
        stats: result ? await mapStats(result) : null,
      });
    }

    if (req.method === "POST" && path === "/api/rebalance") {
      requireSigner();
      const body = await readBody(req);
      const amount = normalizeAmount(body.amount || "1");
      const { hash, result, status } = await vault.execute("rebalance_to_buffer", [
        toI128(toBaseUnits(amount)),
      ]);
      pushActivity({
        id: hash || `rebalance_${Date.now()}`,
        kind: "yield",
        label: "Rebalanced Blend → buffer",
        amount: `${amount} USDC`,
      });
      return sendJson(res, {
        txHash: hash,
        status: status === "SUCCESS" ? "confirmed" : String(status || "pending"),
        stats: result ? await mapStats(result) : null,
      });
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not found", path }));
  } catch (error) {
    console.error("Request error:", error);
    const normalized = humanizeChainError(error);
    const status = normalized.statusCode || 500;
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: normalized.message || String(normalized) }));
  }
}

export default async function handler(req, res) {
  return handleRequest(req, res);
}

// Local Node server when executed directly
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("server.js") || process.argv[1].endsWith("index.mjs"));

if (isMain && !process.env.VERCEL) {
  // local bootstrap for backend/src/server.js path
}
