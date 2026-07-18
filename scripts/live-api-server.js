import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.YIELDFLOW_API_PORT || 8787);
const TOKEN_DECIMALS = 7;
const EMPLOYEE_NAME = "Test Employee";
const DEFAULT_WITHDRAW_UNITS = 1000n;

const deployment = JSON.parse(await readFile(new URL("../deployments/testnet.json", import.meta.url), "utf8"));
const usdcConfig = JSON.parse(await readFile(new URL("../config/testnet-usdc.json", import.meta.url), "utf8"));
const employeeAddress = usdcConfig.accounts.employee.address;
const txStatuses = new Map();

const server = createServer(async (req, res) => {
  try {
    setCors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return json(res, { ok: true, network: deployment.network });
    }

    if (req.method === "GET" && url.pathname === "/api/employer") {
      return json(res, {
        address: deployment.employer_address,
        network: "stellar-testnet",
        connectedAt: new Date().toISOString()
      });
    }

    if (req.method === "GET" && url.pathname === "/api/stats") {
      const stats = await invokeJson(deployment.vault_contract_id, ["stats"]);
      return json(res, mapStats(stats));
    }

    if (req.method === "GET" && url.pathname === "/api/activity") {
      return json(res, [
        { id: "deploy", kind: "yield", label: "Contracts deployed", timestamp: "Testnet", amount: "Live" },
        { id: "deposit-smoke", kind: "deposit", label: "Smoke deposit", timestamp: "Testnet", amount: "+10 USDC" },
        { id: "withdraw-smoke", kind: "withdraw", label: "Smoke withdrawal", timestamp: "Testnet", amount: "-0.0001 USDC" }
      ]);
    }

    if (req.method === "GET" && url.pathname === "/api/employee/session") {
      return json(res, { employeeId: employeeAddress });
    }

    if (req.method === "POST" && url.pathname === "/api/employee/login") {
      return json(res, {
        employeeId: employeeAddress,
        name: EMPLOYEE_NAME,
        walletAddress: employeeAddress
      });
    }

    if (req.method === "GET" && url.pathname === "/api/employee/balance") {
      const employee = url.searchParams.get("employeeId") || employeeAddress;
      const balance = await invokeJson(deployment.streaming_contract_id, ["balance", "--employee", employee]);
      return json(res, mapBalance(balance));
    }

    if (req.method === "GET" && url.pathname === "/api/tx/status") {
      const txHash = url.searchParams.get("txHash") || "";
      return json(res, { status: txStatuses.get(txHash) || "confirmed" });
    }

    if (req.method === "POST" && url.pathname === "/api/deposit") {
      const body = await readJson(req);
      const amount = normalizeAmount(body.amount || "1");
      const { data, txHash } = await runPowerShellScript("deposit-payroll.ps1", ["-Amount", amount]);
      if (txHash) txStatuses.set(txHash, "confirmed");
      return json(res, {
        txHash: txHash || `deposit_${Date.now()}`,
        status: "confirmed",
        amount,
        stats: mapStats(data)
      });
    }

    if (req.method === "POST" && url.pathname === "/api/withdraw") {
      const body = await readJson(req);
      const employee = body.employeeId || employeeAddress;
      const balance = await invokeJson(deployment.streaming_contract_id, ["balance", "--employee", employee]);
      const withdrawable = BigInt(balance.withdrawable_amount || 0);
      if (withdrawable <= 0n) {
        return json(res, {
          txHash: `withdraw_${Date.now()}`,
          status: "failed",
          amountReceived: "0"
        });
      }

      const amountUnits = withdrawable < DEFAULT_WITHDRAW_UNITS ? withdrawable : DEFAULT_WITHDRAW_UNITS;
      const amount = fromBaseUnits(amountUnits);
      const { data, txHash } = await runPowerShellScript("withdraw-demo.ps1", [
        "-Employee",
        employee,
        "-Amount",
        amount
      ]);
      if (txHash) txStatuses.set(txHash, "confirmed");
      return json(res, {
        txHash: txHash || `withdraw_${Date.now()}`,
        status: "confirmed",
        amountReceived: amount,
        stats: mapStats(data)
      });
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: error.message || String(error) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`YieldFlow live API listening on http://127.0.0.1:${PORT}`);
});

function setCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");
}

function json(res, body) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function invokeJson(contractId, args) {
  const { stdout, stderr } = await execFileAsync("stellar", [
    "contract",
    "invoke",
    "--network",
    deployment.network,
    "--source-account",
    deployment.source_account,
    "--id",
    contractId,
    "--",
    ...args
  ]);
  return parseFirstJson(`${stdout}\n${stderr}`);
}

async function runPowerShellScript(scriptName, args) {
  const scriptPath = new URL(`./${scriptName}`, import.meta.url).pathname;
  const { stdout, stderr } = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    decodeURIComponent(scriptPath),
    ...args
  ]);
  const output = `${stdout}\n${stderr}`;
  return {
    data: parseFirstJson(output),
    txHash: output.match(/[a-f0-9]{64}/i)?.[0] || null
  };
}

function parseFirstJson(output) {
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !["{", "["].includes(trimmed[0])) continue;
    try {
      return JSON.parse(trimmed);
    } catch {
      continue;
    }
  }
  throw new Error(`No JSON found in command output: ${output.slice(0, 300)}`);
}

function mapStats(stats) {
  return {
    totalPool: fromBaseUnits(stats.total_pool),
    yieldEarned: "0",
    bufferAmount: fromBaseUnits(stats.buffer_balance),
    bufferPercent: Number(stats.buffer_bps || 0) / 100,
    yieldRoutePercent: Number(stats.yield_bps || 0) / 100,
    activeEmployees: 1,
    projectedApy: "0.0"
  };
}

function mapBalance(balance) {
  return {
    unlockedAmount: fromBaseUnits(balance.unlocked_amount),
    ratePerSecond: fromBaseUnits(balance.rate_per_second),
    totalStreamed: fromBaseUnits(balance.withdrawn_amount),
    streamCap: fromBaseUnits(balance.total_amount),
    nextPayday: formatNextPayday(balance.end_time)
  };
}

function normalizeAmount(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Amount must be a positive decimal number.");
  }
  return normalized;
}

function fromBaseUnits(value) {
  const raw = BigInt(value || 0);
  const whole = raw / 10n ** BigInt(TOKEN_DECIMALS);
  const fraction = String(raw % 10n ** BigInt(TOKEN_DECIMALS)).padStart(TOKEN_DECIMALS, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function formatNextPayday(endTime) {
  const seconds = Number(endTime || 0) - Math.floor(Date.now() / 1000);
  if (seconds <= 0) return "Complete";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
