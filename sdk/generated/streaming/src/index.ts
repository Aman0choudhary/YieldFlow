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
  3: {message:"InvalidAmount"},
  4: {message:"InvalidSchedule"},
  5: {message:"StreamAlreadyExists"},
  6: {message:"StreamNotFound"},
  7: {message:"InsufficientUnlockedBalance"}
}


export interface Config {
  employer: string;
  withdrawal_controller: string;
}


export interface Stream {
  employee: string;
  end_time: u64;
  start_time: u64;
  total_amount: i128;
  withdrawn_amount: i128;
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
  init: ({employer, withdrawal_controller}: {employer: string, withdrawal_controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a config transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  config: (options?: MethodOptions) => Promise<AssembledTransaction<Config>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: ({employee}: {employee: string}, options?: MethodOptions) => Promise<AssembledTransaction<BalanceSnapshot>>

  /**
   * Construct and simulate a get_stream transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_stream: ({employee}: {employee: string}, options?: MethodOptions) => Promise<AssembledTransaction<Stream>>

  /**
   * Construct and simulate a create_stream transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_stream: ({employee, total_amount, start_time, end_time}: {employee: string, total_amount: i128, start_time: u64, end_time: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Stream>>

  /**
   * Construct and simulate a record_withdrawal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_withdrawal: ({employee, amount}: {employee: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<BalanceSnapshot>>

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
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABwAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAA5Ob3RJbml0aWFsaXplZAAAAAAAAgAAAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAAMAAAAAAAAAD0ludmFsaWRTY2hlZHVsZQAAAAAEAAAAAAAAABNTdHJlYW1BbHJlYWR5RXhpc3RzAAAAAAUAAAAAAAAADlN0cmVhbU5vdEZvdW5kAAAAAAAGAAAAAAAAABtJbnN1ZmZpY2llbnRVbmxvY2tlZEJhbGFuY2UAAAAABw==",
        "AAAAAQAAAAAAAAAAAAAABkNvbmZpZwAAAAAAAgAAAAAAAAAIZW1wbG95ZXIAAAATAAAAAAAAABV3aXRoZHJhd2FsX2NvbnRyb2xsZXIAAAAAAAAT",
        "AAAAAQAAAAAAAAAAAAAABlN0cmVhbQAAAAAABQAAAAAAAAAIZW1wbG95ZWUAAAATAAAAAAAAAAhlbmRfdGltZQAAAAYAAAAAAAAACnN0YXJ0X3RpbWUAAAAAAAYAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAsAAAAAAAAAEHdpdGhkcmF3bl9hbW91bnQAAAAL",
        "AAAAAQAAAAAAAAAAAAAAD0JhbGFuY2VTbmFwc2hvdAAAAAAJAAAAAAAAAAhlbXBsb3llZQAAABMAAAAAAAAACGVuZF90aW1lAAAABgAAAAAAAAAPcmF0ZV9wZXJfc2Vjb25kAAAAAAsAAAAAAAAACnN0YXJ0X3RpbWUAAAAAAAYAAAAAAAAADHRvdGFsX2Ftb3VudAAAAAsAAAAAAAAAD3VubG9ja2VkX2Ftb3VudAAAAAALAAAAAAAAAAp1cGRhdGVkX2F0AAAAAAAGAAAAAAAAABN3aXRoZHJhd2FibGVfYW1vdW50AAAAAAsAAAAAAAAAEHdpdGhkcmF3bl9hbW91bnQAAAAL",
        "AAAAAAAAAAAAAAAEaW5pdAAAAAIAAAAAAAAACGVtcGxveWVyAAAAEwAAAAAAAAAVd2l0aGRyYXdhbF9jb250cm9sbGVyAAAAAAAAEwAAAAEAAAfQAAAABkNvbmZpZwAA",
        "AAAAAAAAAAAAAAAGY29uZmlnAAAAAAAAAAAAAQAAB9AAAAAGQ29uZmlnAAA=",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAhlbXBsb3llZQAAABMAAAABAAAH0AAAAA9CYWxhbmNlU25hcHNob3QA",
        "AAAAAAAAAAAAAAAKZ2V0X3N0cmVhbQAAAAAAAQAAAAAAAAAIZW1wbG95ZWUAAAATAAAAAQAAB9AAAAAGU3RyZWFtAAA=",
        "AAAAAAAAAAAAAAANY3JlYXRlX3N0cmVhbQAAAAAAAAQAAAAAAAAACGVtcGxveWVlAAAAEwAAAAAAAAAMdG90YWxfYW1vdW50AAAACwAAAAAAAAAKc3RhcnRfdGltZQAAAAAABgAAAAAAAAAIZW5kX3RpbWUAAAAGAAAAAQAAB9AAAAAGU3RyZWFtAAA=",
        "AAAAAAAAAAAAAAARcmVjb3JkX3dpdGhkcmF3YWwAAAAAAAACAAAAAAAAAAhlbXBsb3llZQAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAfQAAAAD0JhbGFuY2VTbmFwc2hvdAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<Config>,
        config: this.txFromJSON<Config>,
        balance: this.txFromJSON<BalanceSnapshot>,
        get_stream: this.txFromJSON<Stream>,
        create_stream: this.txFromJSON<Stream>,
        record_withdrawal: this.txFromJSON<BalanceSnapshot>
  }
}