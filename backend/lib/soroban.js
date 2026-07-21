/**
 * soroban.js — Lightweight wrapper for direct Soroban contract calls.
 *
 * Replaces the generated Stellar CLI bindings so the backend is fully
 * self-contained, with no file-path or workspace dependencies.
 */

import {
  Keypair,
  Contract,
  TransactionBuilder,
  rpc,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const BASE_FEE = "1000000"; // 0.1 XLM — generous for testnet

/**
 * Creates a configured Soroban helper for a specific contract.
 */
export function createContractClient({ contractId, rpcUrl, networkPassphrase, publicKey, keypair }) {
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);
  const passphrase = networkPassphrase || TESTNET_PASSPHRASE;

  return {
    /**
     * Simulate a read-only contract call (no signing needed).
     */
    async simulate(method, args = []) {
      const account = await server.getAccount(publicKey);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: passphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);

      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(`Simulation failed: ${sim.error || "unknown error"}`);
      }

      // Extract the return value
      const retval = sim.result?.retval;
      if (!retval) return null;
      return scValToNative(retval);
    },

    /**
     * Build, simulate, sign, and submit a state-changing contract call.
     * Returns { hash, result }.
     */
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
        networkPassphrase: passphrase,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

      // Simulate to get the prepared (assembled) transaction
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

      // Poll for transaction completion
      const hash = sendResult.hash;
      let status = sendResult;
      const maxRetries = 30;
      for (let i = 0; i < maxRetries; i++) {
        if (status.status !== "PENDING" && status.status !== "NOT_FOUND") break;
        await new Promise((r) => setTimeout(r, 2000));
        status = await server.getTransaction(hash);
      }

      // Try to extract the return value from the completed transaction
      let result = null;
      if (status.status === "SUCCESS" && status.returnValue) {
        result = scValToNative(status.returnValue);
      }

      return { hash, result, status: status.status };
    },
  };
}

/* ── Argument helpers ───────────────────────────────── */

export function toI128(value) {
  return nativeToScVal(BigInt(value), { type: "i128" });
}

export function toAddress(addr) {
  return new Address(addr).toScVal();
}
