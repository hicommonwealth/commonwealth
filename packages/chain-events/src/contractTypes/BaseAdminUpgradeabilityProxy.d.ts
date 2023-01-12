/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type {
  ethers,
  Signer,
  BigNumber,
  PopulatedTransaction,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides} from "ethers";
import {
  EventFilter,
  BigNumberish,
  Contract
} from "ethers";
import type { BytesLike } from "@ethersproject/bytes";
import type { Listener, Provider } from "@ethersproject/providers";
import type { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface BaseAdminUpgradeabilityProxyInterface extends ethers.utils.Interface {
  functions: {
    "admin()": FunctionFragment;
    "changeAdmin(address)": FunctionFragment;
    "implementation()": FunctionFragment;
    "upgradeTo(address)": FunctionFragment;
    "upgradeToAndCall(address,bytes)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "admin", values?: undefined): string;
  encodeFunctionData(functionFragment: "changeAdmin", values: [string]): string;
  encodeFunctionData(
    functionFragment: "implementation",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "upgradeTo", values: [string]): string;
  encodeFunctionData(
    functionFragment: "upgradeToAndCall",
    values: [string, BytesLike]
  ): string;

  decodeFunctionResult(functionFragment: "admin", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "changeAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "implementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "upgradeTo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "upgradeToAndCall",
    data: BytesLike
  ): Result;

  events: {
    "AdminChanged(address,address)": EventFragment;
    "Upgraded(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminChanged"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Upgraded"): EventFragment;
}

export class BaseAdminUpgradeabilityProxy extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter?: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): Array<TypedListener<EventArgsArray, EventArgsObject>>;
  off<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  on<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  once<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeListener<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>,
    listener: TypedListener<EventArgsArray, EventArgsObject>
  ): this;
  removeAllListeners<EventArgsArray extends Array<any>, EventArgsObject>(
    eventFilter: TypedEventFilter<EventArgsArray, EventArgsObject>
  ): this;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>;

  interface: BaseAdminUpgradeabilityProxyInterface;

  functions: {
    admin(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "admin()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    changeAdmin(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "changeAdmin(address)"(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    implementation(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "implementation()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "upgradeTo(address)"(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "upgradeToAndCall(address,bytes)"(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  admin(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "admin()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  changeAdmin(
    newAdmin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "changeAdmin(address)"(
    newAdmin: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  implementation(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "implementation()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  upgradeTo(
    newImplementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "upgradeTo(address)"(
    newImplementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  upgradeToAndCall(
    newImplementation: string,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "upgradeToAndCall(address,bytes)"(
    newImplementation: string,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    admin(overrides?: CallOverrides): Promise<string>;

    "admin()"(overrides?: CallOverrides): Promise<string>;

    changeAdmin(newAdmin: string, overrides?: CallOverrides): Promise<void>;

    "changeAdmin(address)"(
      newAdmin: string,
      overrides?: CallOverrides
    ): Promise<void>;

    implementation(overrides?: CallOverrides): Promise<string>;

    "implementation()"(overrides?: CallOverrides): Promise<string>;

    upgradeTo(
      newImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    "upgradeTo(address)"(
      newImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "upgradeToAndCall(address,bytes)"(
      newImplementation: string,
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    AdminChanged(
      previousAdmin: null,
      newAdmin: null
    ): TypedEventFilter<
      [string, string],
      { previousAdmin: string; newAdmin: string }
    >;

    Upgraded(
      implementation: string | null
    ): TypedEventFilter<[string], { implementation: string }>;
  };

  estimateGas: {
    admin(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "admin()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    changeAdmin(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "changeAdmin(address)"(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    implementation(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "implementation()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "upgradeTo(address)"(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "upgradeToAndCall(address,bytes)"(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    admin(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "admin()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    changeAdmin(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "changeAdmin(address)"(
      newAdmin: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    implementation(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "implementation()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    upgradeTo(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "upgradeTo(address)"(
      newImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    upgradeToAndCall(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "upgradeToAndCall(address,bytes)"(
      newImplementation: string,
      data: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
