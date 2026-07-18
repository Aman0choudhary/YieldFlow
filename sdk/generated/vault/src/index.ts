import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export const Errors = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"InvalidSplit"},
  4: {message:"InvalidAmount"},
  5: {message:"InsufficientBuffer"},
  6: {message:"InsufficientYieldPrincipal"}
}


export interface Config {
  buffer_bps: u32;
  employer: string;
  streaming_contract: string;
  token: string;
  withdrawal_controller: string;
  yield_bps: u32;
}


export interface VaultState {
  buffer_balance: i128;
  total_deposited: i128;
  total_released: i128;
  yield_principal: i128;
}


export interface VaultStats {
  buffer_balance: i128;
  buffer_bps: u32;
  buffer_healthy: boolean;
  token: string;
  total_deposited: i128;
  total_pool: i128;
  total_released: i128;
  yield_bps: u32;
  yield_principal: i128;
}


export interface BalanceSnapshot {
  employee: string;
  end_time: u64;
  rate_per_second: i128;
  start_time: u64;
  total_amount: i128;
  unlocked_amount: i128;
  updated_at: u64;
  withdrawable_amount: i128;
  withdrawn_amount: i128;
}

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  init: ({employer, withdrawal_controller, streaming_contract, token, buffer_bps, yield_bps}: {employer: string, withdrawal_controller: string, streaming_contract: string, token: string, buffer_bps: u32, yield_bps: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  stats: (options?: MethodOptions) => Promise<AssembledTransaction<VaultStats>>

  /**
   * Construct and simulate a config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a release_buffer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_buffer: ({recipient, amount}: {recipient: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<VaultStats>>

  /**
   * Construct and simulate a deposit_payroll transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deposit_payroll: ({amount}: {amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<VaultStats>>

  /**
   * Construct and simulate a rebalance_to_buffer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  rebalance_to_buffer: ({amount}: {amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<VaultStats>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAAMSW52YWxpZFNwbGl0AAAAAwAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAQAAAAAAAAAEkluc3VmZmljaWVudEJ1ZmZlcgAAAAAABQAAAAAAAAAaSW5zdWZmaWNpZW50WWllbGRQcmluY2lwYWwAAAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAABgAAAAAAAAAKYnVmZmVyX2JwcwAAAAAABAAAAAAAAAAIZW1wbG95ZXIAAAATAAAAAAAAABJzdHJlYW1pbmdfY29udHJhY3QAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAVd2l0aGRyYXdhbF9jb250cm9sbGVyAAAAAAAAEwAAAAAAAAAJeWllbGRfYnBzAAAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAAClZhdWx0U3RhdGUAAAAAAAQAAAAAAAAADmJ1ZmZlcl9iYWxhbmNlAAAAAAALAAAAAAAAAA90b3RhbF9kZXBvc2l0ZWQAAAAACwAAAAAAAAAOdG90YWxfcmVsZWFzZWQAAAAAAAsAAAAAAAAAD3lpZWxkX3ByaW5jaXBhbAAAAAAL",
        "AAAAAQAAAAAAAAAAAAAAClZhdWx0U3RhdHMAAAAAAAkAAAAAAAAADmJ1ZmZlcl9iYWxhbmNlAAAAAAALAAAAAAAAAApidWZmZXJfYnBzAAAAAAAEAAAAAAAAAA5idWZmZXJfaGVhbHRoeQAAAAAAAQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAA90b3RhbF9kZXBvc2l0ZWQAAAAACwAAAAAAAAAKdG90YWxfcG9vbAAAAAAACwAAAAAAAAAOdG90YWxfcmVsZWFzZWQAAAAAAAsAAAAAAAAACXlpZWxkX2JwcwAAAAAAAAQAAAAAAAAAD3lpZWxkX3ByaW5jaXBhbAAAAAAL",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAYAAAAAAAAACGVtcGxveWVyAAAAEwAAAAAAAAAVd2l0aGRyYXdhbF9jb250cm9sbGVyAAAAAAAAEwAAAAAAAAASc3RyZWFtaW5nX2NvbnRyYWN0AAAAAAATAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAACmJ1ZmZlcl9icHMAAAAAAAQAAAAAAAAACXlpZWxkX2JwcwAAAAAAAAQAAAABAAAH0AAAAAZDb25maWcAAA==",
        "AAAAAAAAAAAAAAAFc3RhdHMAAAAAAAAAAAAAAQAAB9AAAAAKVmF1bHRTdGF0cwAA",
        "AAAAAAAAAAAAAAAGY29uZmlnAAAAAAAAAAAAAQAAB9AAAAAGQ29uZmlnAAA=",
        "AAAAAQAAAAAAAAAAAAAAD0JhbGFuY2VTbmFwc2hvdAAAAAAJAAAAAAAAAAhlbXBsb3llZQAAABMAAAAAAAAACGVuZF90aW1lAAAABgAAAAAAAAAPcmF0ZV9wZXJfc2Vjb25kAAAAAAsAAAAAAAAACnN0YXJ0X3RpbWUAAAAAAAYAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAsAAAAAAAAAD3VubG9ja2VkX2Ftb3VudAAAAAALAAAAAAAAAAp1cGRhdGVkX2F0AAAAAAAGAAAAAAAAABN3aXRoZHJhd2FibGVfYW1vdW50AAAAAAsAAAAAAAAAEHdpdGhkcmF3bl9hbW91bnQAAAAL",
        "AAAAAAAAAAAAAAAOcmVsZWFzZV9idWZmZXIAAAAAAAIAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAfQAAAAClZhdWx0U3RhdHMAAA==",
        "AAAAAAAAAAAAAAAPZGVwb3NpdF9wYXlyb2xsAAAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAfQAAAAClZhdWx0U3RhdHMAAA==",
        "AAAAAAAAAAAAAAATcmViYWxhbmNlX3RvX2J1ZmZlcgAAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAH0AAAAApWYXVsdFN0YXRzAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<Config>,
        stats: this.txFromJSON<VaultStats>,
        config: this.txFromJSON<Config>,
        release_buffer: this.txFromJSON<VaultStats>,
        deposit_payroll: this.txFromJSON<VaultStats>,
        rebalance_to_buffer: this.txFromJSON<VaultStats>
  }
}