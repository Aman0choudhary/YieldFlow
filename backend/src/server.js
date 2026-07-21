/**
 * YieldFlow Backend Server
 *
 * Self-contained Node.js server that talks directly to the deployed
 * Stellar testnet Soroban contracts. No generated SDK dependency —
 * uses @stellar/stellar-sdk for all contract interactions.
 *
 * Runs locally with `node src/server.js` or as a Vercel serverless
 * function via `api/index.js`.
 */

import { createServer } from "node:http";
import { Keypair } from "@stellar/stellar-sdk";
import { createContractClient, toI128, toAddress } from "../lib/soroban.js";
import { setCors, json, readJson, toBaseUnits, fromBaseUnits, normalizeAmount, formatNextPayday } from "../lib/helpers.js";

const DEFAULT_WITHDRAW_UNITS = 1000n;

/* ── Configuration (all from env vars, sensible testnet defaults) ── */

const config = {
  port: Number(process.env.PORT || process.env.YIELDFLOW_API_PORT || 8787),
  rpcUrl: process.env.YIELDFLOW_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.YIELDFLOW_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  allowedOrigin: process.env.YIELDFLOW_ALLOWED_ORIGIN || "*",
  signerSecret: process.env.YIELDFLOW_SIGNER_SECRET || "",
  publicKey: process.env.YIELDFLOW_PUBLIC_KEY || "GD2XEYNTQ4BWVK6ORZPHU625ZKRT2ICPDVSEXCDLPWCHHJXBPPMD6IJM",
  vaultContractId: process.env.YIELDFLOW_VAULT_CONTRACT_ID || "CAK54ESAEOSJUZM473KCUJMMFYRYT6TVJYMGRCEXGTWSVH5SA3WZFE5B",
  streamingContractId: process.env.YIELDFLOW_STREAMING_CONTRACT_ID || "CAFCD3TBDN5DQA5URIHJXEVZJLIJL7MMHI5KXSBLQLL4CZM2WZCEEBFU",
  employeeAddress: process.env.YIELDFLOW_EMPLOYEE_ADDRESS || "GBPDU4S2VIXMNW4VUZKNFHQ7CHAU2RZA7DGPY4K77CZFGK6LMESZWSL4",
};

/* ── Signer / clients ─────────────────────────────────── */

const signerKeypair = config.signerSecret && config.signerSecret !== "SBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  ? Keypair.fromSecret(config.signerSecret)
  : null;

const publicKey = signerKeypair?.publicKey() || config.publicKey;

const clientOpts = {
  rpcUrl: config.rpcUrl,
  networkPassphrase: config.networkPassphrase,
  publicKey,
  keypair: signerKeypair,
};

const vault = createContractClient({ ...clientOpts, contractId: config.vaultContractId });
const streaming = createContractClient({ ...clientOpts, contractId: config.streamingContractId });

const txStatuses = new Map();

/* ── Request handler ──────────────────────────────────── */

export async function handleRequest(req, res) {
  try {
    setCors(res, config.allowedOrigin);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;

    /* ── Health ────────────────────────────────────── */
    if (req.method === "GET" && path === "/api/health") {
      return json(res, {
        ok: true,
        network: "stellar-testnet",
        signerConfigured: Boolean(signerKeypair),
        vaultContractId: config.vaultContractId,
        streamingContractId: config.streamingContractId,
      });
    }

    /* ── Employer connect ─────────────────────────── */
    if (req.method === "GET" && path === "/api/employer") {
      return json(res, {
        address: publicKey,
        network: "stellar-testnet",
        connectedAt: new Date().toISOString(),
      });
    }

    /* ── Vault stats (read-only) ──────────────────── */
    if (req.method === "GET" && path === "/api/stats") {
      const result = await vault.simulate("stats");
      return json(res, mapStats(result));
    }

    /* ── Activity feed ────────────────────────────── */
    if (req.method === "GET" && path === "/api/activity") {
      return json(res, [
        { id: "deploy", kind: "yield", label: "Contracts deployed", timestamp: "Testnet", amount: "Live" },
        { id: "deposit-smoke", kind: "deposit", label: "Smoke deposit", timestamp: "Testnet", amount: "+10 USDC" },
        { id: "withdraw-smoke", kind: "withdraw", label: "Smoke withdrawal", timestamp: "Testnet", amount: "-0.0001 USDC" },
      ]);
    }

    /* ── Employee session restore ─────────────────── */
    if (req.method === "GET" && path === "/api/employee/session") {
      return json(res, { employeeId: config.employeeAddress });
    }

    /* ── Employee login (demo) ────────────────────── */
    if (req.method === "POST" && path === "/api/employee/login") {
      return json(res, {
        employeeId: config.employeeAddress,
        name: "Test Employee",
        walletAddress: config.employeeAddress,
      });
    }

    /* ── Employee balance (read-only) ─────────────── */
    if (req.method === "GET" && path === "/api/employee/balance") {
      const employee = url.searchParams.get("employeeId") || config.employeeAddress;
      const result = await streaming.simulate("balance", [toAddress(employee)]);
      return json(res, mapBalance(result));
    }

    /* ── Transaction status ───────────────────────── */
    if (req.method === "GET" && path === "/api/tx/status") {
      const txHash = url.searchParams.get("txHash") || "";
      return json(res, { status: txStatuses.get(txHash) || "confirmed" });
    }

    /* ── Deposit payroll (state-changing) ──────────── */
    if (req.method === "POST" && path === "/api/deposit") {
      requireSigner();
      const body = await readJson(req);
      const amount = normalizeAmount(body.amount || "1");
      const amountUnits = toBaseUnits(amount);

      const { hash, result } = await vault.execute("deposit_payroll", [toI128(amountUnits)]);
      if (hash) txStatuses.set(hash, "confirmed");

      return json(res, {
        txHash: hash || `deposit_${Date.now()}`,
        status: "confirmed",
        amount,
        stats: result ? mapStats(result) : null,
      });
    }

    /* ── Withdraw (state-changing) ─────────────────── */
    if (req.method === "POST" && path === "/api/withdraw") {
      requireSigner();
      const body = await readJson(req);
      const employee = body.employeeId || config.employeeAddress;

      // Check how much the employee can withdraw
      const balance = await streaming.simulate("balance", [toAddress(employee)]);
      const withdrawable = BigInt(balance?.withdrawable_amount || 0);

      if (withdrawable <= 0n) {
        return json(res, {
          txHash: `withdraw_${Date.now()}`,
          status: "failed",
          amountReceived: "0",
        });
      }

      const amount = withdrawable < DEFAULT_WITHDRAW_UNITS ? withdrawable : DEFAULT_WITHDRAW_UNITS;
      const { hash, result } = await vault.execute("release_buffer", [
        toAddress(employee),
        toI128(amount),
      ]);
      if (hash) txStatuses.set(hash, "confirmed");

      return json(res, {
        txHash: hash || `withdraw_${Date.now()}`,
        status: "confirmed",
        amountReceived: fromBaseUnits(amount),
        stats: result ? mapStats(result) : null,
      });
    }

    /* ── 404 ──────────────────────────────────────── */
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Request error:", error);
    const status = error.statusCode || 500;
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: error.message || String(error) }));
  }
}

/* ── Helpers ──────────────────────────────────────────── */

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

/* ── Start server (local dev only; Vercel uses api/index.js) ──── */

const server = createServer(handleRequest);
server.listen(config.port, "0.0.0.0", () => {
  console.log(`YieldFlow backend listening on port ${config.port}`);
  console.log(`Allowed origin: ${config.allowedOrigin}`);
  console.log(`Signer configured: ${Boolean(signerKeypair)}`);
});
