/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type {
  ethers,
  Signer,
  BigNumber,
  PopulatedTransaction,
  CallOverrides} from "ethers";
import {
  EventFilter,
  BigNumberish,
  Contract,
  ContractTransaction
} from "ethers";
import type { BytesLike } from "@ethersproject/bytes";
import type { Listener, Provider } from "@ethersproject/providers";
import type { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface MockETHChainlinkUSDAdapterInterface extends ethers.utils.Interface {
  functions: {
    "getPriceInUSD()": FunctionFragment;
    "viewPriceInUSD()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "getPriceInUSD",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "viewPriceInUSD",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "getPriceInUSD",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "viewPriceInUSD",
    data: BytesLike
  ): Result;

  events: {
    "PriceUpdated(address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "PriceUpdated"): EventFragment;
}

export class MockETHChainlinkUSDAdapter extends Contract {
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

  interface: MockETHChainlinkUSDAdapterInterface;

  functions: {
    getPriceInUSD(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { price: BigNumber }>;

    "getPriceInUSD()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { price: BigNumber }>;

    viewPriceInUSD(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { price: BigNumber }>;

    "viewPriceInUSD()"(
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { price: BigNumber }>;
  };

  getPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

  "getPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;

  viewPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

  "viewPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    getPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

    "getPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;

    viewPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

    "viewPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    PriceUpdated(
      asset: null,
      newPrice: null
    ): TypedEventFilter<
      [string, BigNumber],
      { asset: string; newPrice: BigNumber }
    >;
  };

  estimateGas: {
    getPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

    "getPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;

    viewPriceInUSD(overrides?: CallOverrides): Promise<BigNumber>;

    "viewPriceInUSD()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    getPriceInUSD(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "getPriceInUSD()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    viewPriceInUSD(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "viewPriceInUSD()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
