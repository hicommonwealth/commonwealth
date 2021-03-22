/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import { Contract, ContractTransaction, EventFilter, Signer } from "ethers";
import { Listener, Provider } from "ethers/providers";
import { Arrayish, BigNumber, BigNumberish, Interface } from "ethers/utils";
import {
  TransactionOverrides,
  TypedEventDescription,
  TypedFunctionDescription
} from ".";

interface MPondInterface extends Interface {
  functions: {
    DELEGATION_TYPEHASH: TypedFunctionDescription<{ encode([]: []): string }>;

    DOMAIN_TYPEHASH: TypedFunctionDescription<{ encode([]: []): string }>;

    UNDELEGATION_TYPEHASH: TypedFunctionDescription<{ encode([]: []): string }>;

    admin: TypedFunctionDescription<{ encode([]: []): string }>;

    bridgeSupply: TypedFunctionDescription<{ encode([]: []): string }>;

    checkpoints: TypedFunctionDescription<{
      encode([,]: [string, BigNumberish]): string;
    }>;

    decimals: TypedFunctionDescription<{ encode([]: []): string }>;

    delegates: TypedFunctionDescription<{
      encode([,]: [string, string]): string;
    }>;

    enableAllTranfers: TypedFunctionDescription<{ encode([]: []): string }>;

    isWhiteListed: TypedFunctionDescription<{ encode([]: [string]): string }>;

    name: TypedFunctionDescription<{ encode([]: []): string }>;

    nonces: TypedFunctionDescription<{ encode([]: [string]): string }>;

    numCheckpoints: TypedFunctionDescription<{ encode([]: [string]): string }>;

    symbol: TypedFunctionDescription<{ encode([]: []): string }>;

    totalSupply: TypedFunctionDescription<{ encode([]: []): string }>;

    addWhiteListAddress: TypedFunctionDescription<{
      encode([_address]: [string]): string;
    }>;

    enableAllTransfers: TypedFunctionDescription<{ encode([]: []): string }>;

    isWhiteListedTransfer: TypedFunctionDescription<{
      encode([_address1, _address2]: [string, string]): string;
    }>;

    allowance: TypedFunctionDescription<{
      encode([account, spender]: [string, string]): string;
    }>;

    approve: TypedFunctionDescription<{
      encode([spender, rawAmount]: [string, BigNumberish]): string;
    }>;

    balanceOf: TypedFunctionDescription<{
      encode([account]: [string]): string;
    }>;

    transfer: TypedFunctionDescription<{
      encode([dst, rawAmount]: [string, BigNumberish]): string;
    }>;

    transferFrom: TypedFunctionDescription<{
      encode([src, dst, rawAmount]: [string, string, BigNumberish]): string;
    }>;

    delegate: TypedFunctionDescription<{
      encode([delegatee, amount]: [string, BigNumberish]): string;
    }>;

    undelegate: TypedFunctionDescription<{
      encode([delegatee, amount]: [string, BigNumberish]): string;
    }>;

    delegateBySig: TypedFunctionDescription<{
      encode([delegatee, nonce, expiry, v, r, s, amount]: [
        string,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        Arrayish,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    undelegateBySig: TypedFunctionDescription<{
      encode([delegatee, nonce, expiry, v, r, s, amount]: [
        string,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        Arrayish,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    getCurrentVotes: TypedFunctionDescription<{
      encode([account]: [string]): string;
    }>;

    getPriorVotes: TypedFunctionDescription<{
      encode([account, blockNumber]: [string, BigNumberish]): string;
    }>;
  };

  events: {
    Approval: TypedEventDescription<{
      encodeTopics([owner, spender, amount]: [
        string | null,
        string | null,
        null
      ]): string[];
    }>;

    DelegateChanged: TypedEventDescription<{
      encodeTopics([delegator, fromDelegate, toDelegate]: [
        string | null,
        string | null,
        string | null
      ]): string[];
    }>;

    DelegateVotesChanged: TypedEventDescription<{
      encodeTopics([delegate, previousBalance, newBalance]: [
        string | null,
        null,
        null
      ]): string[];
    }>;

    Transfer: TypedEventDescription<{
      encodeTopics([from, to, amount]: [
        string | null,
        string | null,
        null
      ]): string[];
    }>;
  };
}

export class MPond extends Contract {
  connect(signerOrProvider: Signer | Provider | string): MPond;
  attach(addressOrName: string): MPond;
  deployed(): Promise<MPond>;

  on(event: EventFilter | string, listener: Listener): MPond;
  once(event: EventFilter | string, listener: Listener): MPond;
  addListener(eventName: EventFilter | string, listener: Listener): MPond;
  removeAllListeners(eventName: EventFilter | string): MPond;
  removeListener(eventName: any, listener: Listener): MPond;

  interface: MPondInterface;

  functions: {
    DELEGATION_TYPEHASH(): Promise<string>;

    DOMAIN_TYPEHASH(): Promise<string>;

    UNDELEGATION_TYPEHASH(): Promise<string>;

    admin(): Promise<string>;

    bridgeSupply(): Promise<BigNumber>;

    checkpoints(
      arg0: string,
      arg1: BigNumberish
    ): Promise<{
      fromBlock: number;
      votes: BigNumber;
      0: number;
      1: BigNumber;
    }>;

    decimals(): Promise<number>;

    delegates(arg0: string, arg1: string): Promise<BigNumber>;

    enableAllTranfers(): Promise<boolean>;

    isWhiteListed(arg0: string): Promise<boolean>;

    name(): Promise<string>;

    nonces(arg0: string): Promise<BigNumber>;

    numCheckpoints(arg0: string): Promise<number>;

    symbol(): Promise<string>;

    totalSupply(): Promise<BigNumber>;

    addWhiteListAddress(
      _address: string,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    enableAllTransfers(
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    isWhiteListedTransfer(
      _address1: string,
      _address2: string
    ): Promise<boolean>;

    /**
     * Get the number of tokens `spender` is approved to spend on behalf of `account`
     * @param account The address of the account holding the funds
     * @param spender The address of the account spending the funds
     * @returns The number of tokens approved
     */
    allowance(account: string, spender: string): Promise<BigNumber>;

    /**
     * This will overwrite the approval amount for `spender` and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)
     * Approve `spender` to transfer up to `amount` from `src`
     * @param rawAmount The number of tokens that are approved (2^256-1 means infinite)
     * @param spender The address of the account which may transfer tokens
     * @returns Whether or not the approval succeeded
     */
    approve(
      spender: string,
      rawAmount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Get the number of tokens held by the `account`
     * @param account The address of the account to get the balance of
     * @returns The number of tokens held
     */
    balanceOf(account: string): Promise<BigNumber>;

    /**
     * Transfer `amount` tokens from `msg.sender` to `dst`
     * @param dst The address of the destination account
     * @param rawAmount The number of tokens to transfer
     * @returns Whether or not the transfer succeeded
     */
    transfer(
      dst: string,
      rawAmount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Transfer `amount` tokens from `src` to `dst`
     * @param dst The address of the destination account
     * @param rawAmount The number of tokens to transfer
     * @param src The address of the source account
     * @returns Whether or not the transfer succeeded
     */
    transferFrom(
      src: string,
      dst: string,
      rawAmount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Delegate votes from `msg.sender` to `delegatee`
     * @param delegatee The address to delegate votes to
     */
    delegate(
      delegatee: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    undelegate(
      delegatee: string,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param expiry The time at which to expire the signature
     * @param nonce The contract state required to match the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     * @param v The recovery byte of the signature
     */
    delegateBySig(
      delegatee: string,
      nonce: BigNumberish,
      expiry: BigNumberish,
      v: BigNumberish,
      r: Arrayish,
      s: Arrayish,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    undelegateBySig(
      delegatee: string,
      nonce: BigNumberish,
      expiry: BigNumberish,
      v: BigNumberish,
      r: Arrayish,
      s: Arrayish,
      amount: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    /**
     * Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @returns The number of current votes for `account`
     */
    getCurrentVotes(account: string): Promise<BigNumber>;

    /**
     * Block number must be a finalized block or else this function will revert to prevent misinformation.
     * Determine the prior number of votes for an account as of a block number
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @returns The number of votes the account had as of the given block
     */
    getPriorVotes(
      account: string,
      blockNumber: BigNumberish
    ): Promise<BigNumber>;
  };

  DELEGATION_TYPEHASH(): Promise<string>;

  DOMAIN_TYPEHASH(): Promise<string>;

  UNDELEGATION_TYPEHASH(): Promise<string>;

  admin(): Promise<string>;

  bridgeSupply(): Promise<BigNumber>;

  checkpoints(
    arg0: string,
    arg1: BigNumberish
  ): Promise<{
    fromBlock: number;
    votes: BigNumber;
    0: number;
    1: BigNumber;
  }>;

  decimals(): Promise<number>;

  delegates(arg0: string, arg1: string): Promise<BigNumber>;

  enableAllTranfers(): Promise<boolean>;

  isWhiteListed(arg0: string): Promise<boolean>;

  name(): Promise<string>;

  nonces(arg0: string): Promise<BigNumber>;

  numCheckpoints(arg0: string): Promise<number>;

  symbol(): Promise<string>;

  totalSupply(): Promise<BigNumber>;

  addWhiteListAddress(
    _address: string,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  enableAllTransfers(
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  isWhiteListedTransfer(_address1: string, _address2: string): Promise<boolean>;

  /**
   * Get the number of tokens `spender` is approved to spend on behalf of `account`
   * @param account The address of the account holding the funds
   * @param spender The address of the account spending the funds
   * @returns The number of tokens approved
   */
  allowance(account: string, spender: string): Promise<BigNumber>;

  /**
   * This will overwrite the approval amount for `spender` and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)
   * Approve `spender` to transfer up to `amount` from `src`
   * @param rawAmount The number of tokens that are approved (2^256-1 means infinite)
   * @param spender The address of the account which may transfer tokens
   * @returns Whether or not the approval succeeded
   */
  approve(
    spender: string,
    rawAmount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Get the number of tokens held by the `account`
   * @param account The address of the account to get the balance of
   * @returns The number of tokens held
   */
  balanceOf(account: string): Promise<BigNumber>;

  /**
   * Transfer `amount` tokens from `msg.sender` to `dst`
   * @param dst The address of the destination account
   * @param rawAmount The number of tokens to transfer
   * @returns Whether or not the transfer succeeded
   */
  transfer(
    dst: string,
    rawAmount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Transfer `amount` tokens from `src` to `dst`
   * @param dst The address of the destination account
   * @param rawAmount The number of tokens to transfer
   * @param src The address of the source account
   * @returns Whether or not the transfer succeeded
   */
  transferFrom(
    src: string,
    dst: string,
    rawAmount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Delegate votes from `msg.sender` to `delegatee`
   * @param delegatee The address to delegate votes to
   */
  delegate(
    delegatee: string,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  undelegate(
    delegatee: string,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Delegates votes from signatory to `delegatee`
   * @param delegatee The address to delegate votes to
   * @param expiry The time at which to expire the signature
   * @param nonce The contract state required to match the signature
   * @param r Half of the ECDSA signature pair
   * @param s Half of the ECDSA signature pair
   * @param v The recovery byte of the signature
   */
  delegateBySig(
    delegatee: string,
    nonce: BigNumberish,
    expiry: BigNumberish,
    v: BigNumberish,
    r: Arrayish,
    s: Arrayish,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  undelegateBySig(
    delegatee: string,
    nonce: BigNumberish,
    expiry: BigNumberish,
    v: BigNumberish,
    r: Arrayish,
    s: Arrayish,
    amount: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  /**
   * Gets the current votes balance for `account`
   * @param account The address to get votes balance
   * @returns The number of current votes for `account`
   */
  getCurrentVotes(account: string): Promise<BigNumber>;

  /**
   * Block number must be a finalized block or else this function will revert to prevent misinformation.
   * Determine the prior number of votes for an account as of a block number
   * @param account The address of the account to check
   * @param blockNumber The block number to get the vote balance at
   * @returns The number of votes the account had as of the given block
   */
  getPriorVotes(account: string, blockNumber: BigNumberish): Promise<BigNumber>;

  filters: {
    Approval(
      owner: string | null,
      spender: string | null,
      amount: null
    ): EventFilter;

    DelegateChanged(
      delegator: string | null,
      fromDelegate: string | null,
      toDelegate: string | null
    ): EventFilter;

    DelegateVotesChanged(
      delegate: string | null,
      previousBalance: null,
      newBalance: null
    ): EventFilter;

    Transfer(from: string | null, to: string | null, amount: null): EventFilter;
  };

  estimate: {
    DELEGATION_TYPEHASH(): Promise<BigNumber>;

    DOMAIN_TYPEHASH(): Promise<BigNumber>;

    UNDELEGATION_TYPEHASH(): Promise<BigNumber>;

    admin(): Promise<BigNumber>;

    bridgeSupply(): Promise<BigNumber>;

    checkpoints(arg0: string, arg1: BigNumberish): Promise<BigNumber>;

    decimals(): Promise<BigNumber>;

    delegates(arg0: string, arg1: string): Promise<BigNumber>;

    enableAllTranfers(): Promise<BigNumber>;

    isWhiteListed(arg0: string): Promise<BigNumber>;

    name(): Promise<BigNumber>;

    nonces(arg0: string): Promise<BigNumber>;

    numCheckpoints(arg0: string): Promise<BigNumber>;

    symbol(): Promise<BigNumber>;

    totalSupply(): Promise<BigNumber>;

    addWhiteListAddress(_address: string): Promise<BigNumber>;

    enableAllTransfers(): Promise<BigNumber>;

    isWhiteListedTransfer(
      _address1: string,
      _address2: string
    ): Promise<BigNumber>;

    allowance(account: string, spender: string): Promise<BigNumber>;

    approve(spender: string, rawAmount: BigNumberish): Promise<BigNumber>;

    balanceOf(account: string): Promise<BigNumber>;

    transfer(dst: string, rawAmount: BigNumberish): Promise<BigNumber>;

    transferFrom(
      src: string,
      dst: string,
      rawAmount: BigNumberish
    ): Promise<BigNumber>;

    delegate(delegatee: string, amount: BigNumberish): Promise<BigNumber>;

    undelegate(delegatee: string, amount: BigNumberish): Promise<BigNumber>;

    delegateBySig(
      delegatee: string,
      nonce: BigNumberish,
      expiry: BigNumberish,
      v: BigNumberish,
      r: Arrayish,
      s: Arrayish,
      amount: BigNumberish
    ): Promise<BigNumber>;

    undelegateBySig(
      delegatee: string,
      nonce: BigNumberish,
      expiry: BigNumberish,
      v: BigNumberish,
      r: Arrayish,
      s: Arrayish,
      amount: BigNumberish
    ): Promise<BigNumber>;

    getCurrentVotes(account: string): Promise<BigNumber>;

    getPriorVotes(
      account: string,
      blockNumber: BigNumberish
    ): Promise<BigNumber>;
  };
}
