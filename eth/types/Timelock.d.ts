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

interface TimelockInterface extends Interface {
  functions: {
    GRACE_PERIOD: TypedFunctionDescription<{ encode([]: []): string }>;

    MAXIMUM_DELAY: TypedFunctionDescription<{ encode([]: []): string }>;

    MINIMUM_DELAY: TypedFunctionDescription<{ encode([]: []): string }>;

    admin: TypedFunctionDescription<{ encode([]: []): string }>;

    delay: TypedFunctionDescription<{ encode([]: []): string }>;

    pendingAdmin: TypedFunctionDescription<{ encode([]: []): string }>;

    queuedTransactions: TypedFunctionDescription<{
      encode([]: [Arrayish]): string;
    }>;

    setDelay: TypedFunctionDescription<{
      encode([delay_]: [BigNumberish]): string;
    }>;

    acceptAdmin: TypedFunctionDescription<{ encode([]: []): string }>;

    setPendingAdmin: TypedFunctionDescription<{
      encode([pendingAdmin_]: [string]): string;
    }>;

    queueTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    cancelTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;

    executeTransaction: TypedFunctionDescription<{
      encode([target, value, signature, data, eta]: [
        string,
        BigNumberish,
        string,
        Arrayish,
        BigNumberish
      ]): string;
    }>;
  };

  events: {
    CancelTransaction: TypedEventDescription<{
      encodeTopics([txHash, target, value, signature, data, eta]: [
        Arrayish | null,
        string | null,
        null,
        null,
        null,
        null
      ]): string[];
    }>;

    ExecuteTransaction: TypedEventDescription<{
      encodeTopics([txHash, target, value, signature, data, eta]: [
        Arrayish | null,
        string | null,
        null,
        null,
        null,
        null
      ]): string[];
    }>;

    NewAdmin: TypedEventDescription<{
      encodeTopics([newAdmin]: [string | null]): string[];
    }>;

    NewDelay: TypedEventDescription<{
      encodeTopics([newDelay]: [BigNumberish | null]): string[];
    }>;

    NewPendingAdmin: TypedEventDescription<{
      encodeTopics([newPendingAdmin]: [string | null]): string[];
    }>;

    QueueTransaction: TypedEventDescription<{
      encodeTopics([txHash, target, value, signature, data, eta]: [
        Arrayish | null,
        string | null,
        null,
        null,
        null,
        null
      ]): string[];
    }>;
  };
}

export class Timelock extends Contract {
  connect(signerOrProvider: Signer | Provider | string): Timelock;
  attach(addressOrName: string): Timelock;
  deployed(): Promise<Timelock>;

  on(event: EventFilter | string, listener: Listener): Timelock;
  once(event: EventFilter | string, listener: Listener): Timelock;
  addListener(eventName: EventFilter | string, listener: Listener): Timelock;
  removeAllListeners(eventName: EventFilter | string): Timelock;
  removeListener(eventName: any, listener: Listener): Timelock;

  interface: TimelockInterface;

  functions: {
    GRACE_PERIOD(): Promise<BigNumber>;

    MAXIMUM_DELAY(): Promise<BigNumber>;

    MINIMUM_DELAY(): Promise<BigNumber>;

    admin(): Promise<string>;

    delay(): Promise<BigNumber>;

    pendingAdmin(): Promise<string>;

    queuedTransactions(arg0: Arrayish): Promise<boolean>;

    setDelay(
      delay_: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    acceptAdmin(overrides?: TransactionOverrides): Promise<ContractTransaction>;

    setPendingAdmin(
      pendingAdmin_: string,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    queueTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    cancelTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;

    executeTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish,
      overrides?: TransactionOverrides
    ): Promise<ContractTransaction>;
  };

  GRACE_PERIOD(): Promise<BigNumber>;

  MAXIMUM_DELAY(): Promise<BigNumber>;

  MINIMUM_DELAY(): Promise<BigNumber>;

  admin(): Promise<string>;

  delay(): Promise<BigNumber>;

  pendingAdmin(): Promise<string>;

  queuedTransactions(arg0: Arrayish): Promise<boolean>;

  setDelay(
    delay_: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  acceptAdmin(overrides?: TransactionOverrides): Promise<ContractTransaction>;

  setPendingAdmin(
    pendingAdmin_: string,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  queueTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  cancelTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  executeTransaction(
    target: string,
    value: BigNumberish,
    signature: string,
    data: Arrayish,
    eta: BigNumberish,
    overrides?: TransactionOverrides
  ): Promise<ContractTransaction>;

  filters: {
    CancelTransaction(
      txHash: Arrayish | null,
      target: string | null,
      value: null,
      signature: null,
      data: null,
      eta: null
    ): EventFilter;

    ExecuteTransaction(
      txHash: Arrayish | null,
      target: string | null,
      value: null,
      signature: null,
      data: null,
      eta: null
    ): EventFilter;

    NewAdmin(newAdmin: string | null): EventFilter;

    NewDelay(newDelay: BigNumberish | null): EventFilter;

    NewPendingAdmin(newPendingAdmin: string | null): EventFilter;

    QueueTransaction(
      txHash: Arrayish | null,
      target: string | null,
      value: null,
      signature: null,
      data: null,
      eta: null
    ): EventFilter;
  };

  estimate: {
    GRACE_PERIOD(): Promise<BigNumber>;

    MAXIMUM_DELAY(): Promise<BigNumber>;

    MINIMUM_DELAY(): Promise<BigNumber>;

    admin(): Promise<BigNumber>;

    delay(): Promise<BigNumber>;

    pendingAdmin(): Promise<BigNumber>;

    queuedTransactions(arg0: Arrayish): Promise<BigNumber>;

    setDelay(delay_: BigNumberish): Promise<BigNumber>;

    acceptAdmin(): Promise<BigNumber>;

    setPendingAdmin(pendingAdmin_: string): Promise<BigNumber>;

    queueTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;

    cancelTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;

    executeTransaction(
      target: string,
      value: BigNumberish,
      signature: string,
      data: Arrayish,
      eta: BigNumberish
    ): Promise<BigNumber>;
  };
}
