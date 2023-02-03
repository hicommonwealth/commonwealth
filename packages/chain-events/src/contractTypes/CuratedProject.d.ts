/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type {
  ethers,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  ContractTransaction,
  Overrides,
  CallOverrides} from "ethers";
import {
  Contract
} from "ethers";
import type { BytesLike } from "@ethersproject/bytes";
import type { Listener, Provider } from "@ethersproject/providers";
import type { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface CuratedProjectInterface extends ethers.utils.Interface {
  functions: {
    "acceptedToken()": FunctionFragment;
    "bToken()": FunctionFragment;
    "back(uint256)": FunctionFragment;
    "backersWithdraw()": FunctionFragment;
    "beneficiary()": FunctionFragment;
    "beneficiaryWithdraw()": FunctionFragment;
    "cToken()": FunctionFragment;
    "curate(uint256)": FunctionFragment;
    "curatorFee()": FunctionFragment;
    "curatorsWithdraw()": FunctionFragment;
    "deadline()": FunctionFragment;
    "funded()": FunctionFragment;
    "initialize(tuple,tuple,uint256,uint256,address,address,address)": FunctionFragment;
    "lockedWithdraw()": FunctionFragment;
    "metaData()": FunctionFragment;
    "protocolFee()": FunctionFragment;
    "protocolFeeTo()": FunctionFragment;
    "setIpfsHash(bytes32)": FunctionFragment;
    "setName(bytes32)": FunctionFragment;
    "threshold()": FunctionFragment;
    "totalCuratorFunding()": FunctionFragment;
    "totalFunding()": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "acceptedToken",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "bToken", values?: undefined): string;
  encodeFunctionData(functionFragment: "back", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "backersWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "beneficiary",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "beneficiaryWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "cToken", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "curate",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "curatorFee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "curatorsWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "deadline", values?: undefined): string;
  encodeFunctionData(functionFragment: "funded", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [
      {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      BigNumberish,
      BigNumberish,
      string,
      string,
      string
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "lockedWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "metaData", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "protocolFee",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "protocolFeeTo",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setIpfsHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "setName", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "threshold", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "totalCuratorFunding",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalFunding",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptedToken",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "bToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "back", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "backersWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "beneficiary",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "beneficiaryWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "cToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "curate", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "curatorFee", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "curatorsWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deadline", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "funded", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lockedWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "metaData", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "protocolFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "protocolFeeTo",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setIpfsHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setName", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "threshold", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "totalCuratorFunding",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalFunding",
    data: BytesLike
  ): Result;

  events: {
    "Back(address,address,uint256)": EventFragment;
    "Curate(address,address,uint256)": EventFragment;
    "Failed()": EventFragment;
    "Succeeded(uint256,uint256)": EventFragment;
    "Withdraw(address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Back"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Curate"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Failed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Succeeded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdraw"): EventFragment;
}

export class CuratedProject extends Contract {
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

  interface: CuratedProjectInterface;

  functions: {
    acceptedToken(overrides?: CallOverrides): Promise<[string]>;

    "acceptedToken()"(overrides?: CallOverrides): Promise<[string]>;

    bToken(overrides?: CallOverrides): Promise<[string]>;

    "bToken()"(overrides?: CallOverrides): Promise<[string]>;

    back(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "back(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    backersWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "backersWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    beneficiary(overrides?: CallOverrides): Promise<[string]>;

    "beneficiary()"(overrides?: CallOverrides): Promise<[string]>;

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cToken(overrides?: CallOverrides): Promise<[string]>;

    "cToken()"(overrides?: CallOverrides): Promise<[string]>;

    curate(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "curate(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    curatorFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    "curatorFee()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    curatorsWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "curatorsWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    deadline(overrides?: CallOverrides): Promise<[BigNumber]>;

    "deadline()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    funded(overrides?: CallOverrides): Promise<[boolean]>;

    "funded()"(overrides?: CallOverrides): Promise<[boolean]>;

    initialize(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "initialize((uint256,bytes32,bytes32,bytes32,address),(uint256,uint256,address,address),uint256,uint256,address,address,address)"(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    lockedWithdraw(overrides?: CallOverrides): Promise<[boolean]>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<[boolean]>;

    metaData(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string, string, string] & {
        id: BigNumber;
        name: string;
        ipfsHash: string;
        cwUrl: string;
        creator: string;
      }
    >;

    "metaData()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string, string, string] & {
        id: BigNumber;
        name: string;
        ipfsHash: string;
        cwUrl: string;
        creator: string;
      }
    >;

    protocolFee(overrides?: CallOverrides): Promise<[BigNumber]>;

    "protocolFee()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    protocolFeeTo(overrides?: CallOverrides): Promise<[string]>;

    "protocolFeeTo()"(overrides?: CallOverrides): Promise<[string]>;

    setIpfsHash(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setIpfsHash(bytes32)"(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setName(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setName(bytes32)"(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    threshold(overrides?: CallOverrides): Promise<[BigNumber]>;

    "threshold()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    totalCuratorFunding(overrides?: CallOverrides): Promise<[BigNumber]>;

    "totalCuratorFunding()"(overrides?: CallOverrides): Promise<[BigNumber]>;

    totalFunding(overrides?: CallOverrides): Promise<[BigNumber]>;

    "totalFunding()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

  acceptedToken(overrides?: CallOverrides): Promise<string>;

  "acceptedToken()"(overrides?: CallOverrides): Promise<string>;

  bToken(overrides?: CallOverrides): Promise<string>;

  "bToken()"(overrides?: CallOverrides): Promise<string>;

  back(
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "back(uint256)"(
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  backersWithdraw(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "backersWithdraw()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  beneficiary(overrides?: CallOverrides): Promise<string>;

  "beneficiary()"(overrides?: CallOverrides): Promise<string>;

  beneficiaryWithdraw(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "beneficiaryWithdraw()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cToken(overrides?: CallOverrides): Promise<string>;

  "cToken()"(overrides?: CallOverrides): Promise<string>;

  curate(
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "curate(uint256)"(
    _amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  curatorFee(overrides?: CallOverrides): Promise<BigNumber>;

  "curatorFee()"(overrides?: CallOverrides): Promise<BigNumber>;

  curatorsWithdraw(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "curatorsWithdraw()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  deadline(overrides?: CallOverrides): Promise<BigNumber>;

  "deadline()"(overrides?: CallOverrides): Promise<BigNumber>;

  funded(overrides?: CallOverrides): Promise<boolean>;

  "funded()"(overrides?: CallOverrides): Promise<boolean>;

  initialize(
    _metaData: {
      id: BigNumberish;
      name: BytesLike;
      ipfsHash: BytesLike;
      cwUrl: BytesLike;
      creator: string;
    },
    _pData: {
      threshold: BigNumberish;
      deadline: BigNumberish;
      beneficiary: string;
      acceptedToken: string;
    },
    _curatorFee: BigNumberish,
    _protocolFee: BigNumberish,
    _protocolFeeTo: string,
    _bToken: string,
    _cToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "initialize((uint256,bytes32,bytes32,bytes32,address),(uint256,uint256,address,address),uint256,uint256,address,address,address)"(
    _metaData: {
      id: BigNumberish;
      name: BytesLike;
      ipfsHash: BytesLike;
      cwUrl: BytesLike;
      creator: string;
    },
    _pData: {
      threshold: BigNumberish;
      deadline: BigNumberish;
      beneficiary: string;
      acceptedToken: string;
    },
    _curatorFee: BigNumberish,
    _protocolFee: BigNumberish,
    _protocolFeeTo: string,
    _bToken: string,
    _cToken: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  lockedWithdraw(overrides?: CallOverrides): Promise<boolean>;

  "lockedWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

  metaData(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string, string, string] & {
      id: BigNumber;
      name: string;
      ipfsHash: string;
      cwUrl: string;
      creator: string;
    }
  >;

  "metaData()"(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string, string, string] & {
      id: BigNumber;
      name: string;
      ipfsHash: string;
      cwUrl: string;
      creator: string;
    }
  >;

  protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

  "protocolFee()"(overrides?: CallOverrides): Promise<BigNumber>;

  protocolFeeTo(overrides?: CallOverrides): Promise<string>;

  "protocolFeeTo()"(overrides?: CallOverrides): Promise<string>;

  setIpfsHash(
    _ipfsHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setIpfsHash(bytes32)"(
    _ipfsHash: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setName(
    _name: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setName(bytes32)"(
    _name: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  threshold(overrides?: CallOverrides): Promise<BigNumber>;

  "threshold()"(overrides?: CallOverrides): Promise<BigNumber>;

  totalCuratorFunding(overrides?: CallOverrides): Promise<BigNumber>;

  "totalCuratorFunding()"(overrides?: CallOverrides): Promise<BigNumber>;

  totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

  "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    acceptedToken(overrides?: CallOverrides): Promise<string>;

    "acceptedToken()"(overrides?: CallOverrides): Promise<string>;

    bToken(overrides?: CallOverrides): Promise<string>;

    "bToken()"(overrides?: CallOverrides): Promise<string>;

    back(_amount: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    "back(uint256)"(
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    backersWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "backersWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    beneficiary(overrides?: CallOverrides): Promise<string>;

    "beneficiary()"(overrides?: CallOverrides): Promise<string>;

    beneficiaryWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "beneficiaryWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    cToken(overrides?: CallOverrides): Promise<string>;

    "cToken()"(overrides?: CallOverrides): Promise<string>;

    curate(_amount: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    "curate(uint256)"(
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    curatorFee(overrides?: CallOverrides): Promise<BigNumber>;

    "curatorFee()"(overrides?: CallOverrides): Promise<BigNumber>;

    curatorsWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "curatorsWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    deadline(overrides?: CallOverrides): Promise<BigNumber>;

    "deadline()"(overrides?: CallOverrides): Promise<BigNumber>;

    funded(overrides?: CallOverrides): Promise<boolean>;

    "funded()"(overrides?: CallOverrides): Promise<boolean>;

    initialize(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    "initialize((uint256,bytes32,bytes32,bytes32,address),(uint256,uint256,address,address),uint256,uint256,address,address,address)"(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    lockedWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    metaData(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string, string, string] & {
        id: BigNumber;
        name: string;
        ipfsHash: string;
        cwUrl: string;
        creator: string;
      }
    >;

    "metaData()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string, string, string] & {
        id: BigNumber;
        name: string;
        ipfsHash: string;
        cwUrl: string;
        creator: string;
      }
    >;

    protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

    "protocolFee()"(overrides?: CallOverrides): Promise<BigNumber>;

    protocolFeeTo(overrides?: CallOverrides): Promise<string>;

    "protocolFeeTo()"(overrides?: CallOverrides): Promise<string>;

    setIpfsHash(_ipfsHash: BytesLike, overrides?: CallOverrides): Promise<void>;

    "setIpfsHash(bytes32)"(
      _ipfsHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    setName(_name: BytesLike, overrides?: CallOverrides): Promise<void>;

    "setName(bytes32)"(
      _name: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    threshold(overrides?: CallOverrides): Promise<BigNumber>;

    "threshold()"(overrides?: CallOverrides): Promise<BigNumber>;

    totalCuratorFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalCuratorFunding()"(overrides?: CallOverrides): Promise<BigNumber>;

    totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    Back(
      sender: null,
      token: null,
      amount: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { sender: string; token: string; amount: BigNumber }
    >;

    Curate(
      sender: null,
      token: null,
      amount: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { sender: string; token: string; amount: BigNumber }
    >;

    Failed(): TypedEventFilter<[], {}>;

    Succeeded(
      timestamp: null,
      amount: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { timestamp: BigNumber; amount: BigNumber }
    >;

    Withdraw(
      sender: null,
      amount: null
    ): TypedEventFilter<
      [string, BigNumber],
      { sender: string; amount: BigNumber }
    >;
  };

  estimateGas: {
    acceptedToken(overrides?: CallOverrides): Promise<BigNumber>;

    "acceptedToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    bToken(overrides?: CallOverrides): Promise<BigNumber>;

    "bToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    back(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "back(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    backersWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "backersWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    beneficiary(overrides?: CallOverrides): Promise<BigNumber>;

    "beneficiary()"(overrides?: CallOverrides): Promise<BigNumber>;

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cToken(overrides?: CallOverrides): Promise<BigNumber>;

    "cToken()"(overrides?: CallOverrides): Promise<BigNumber>;

    curate(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "curate(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    curatorFee(overrides?: CallOverrides): Promise<BigNumber>;

    "curatorFee()"(overrides?: CallOverrides): Promise<BigNumber>;

    curatorsWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "curatorsWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    deadline(overrides?: CallOverrides): Promise<BigNumber>;

    "deadline()"(overrides?: CallOverrides): Promise<BigNumber>;

    funded(overrides?: CallOverrides): Promise<BigNumber>;

    "funded()"(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "initialize((uint256,bytes32,bytes32,bytes32,address),(uint256,uint256,address,address),uint256,uint256,address,address,address)"(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    lockedWithdraw(overrides?: CallOverrides): Promise<BigNumber>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<BigNumber>;

    metaData(overrides?: CallOverrides): Promise<BigNumber>;

    "metaData()"(overrides?: CallOverrides): Promise<BigNumber>;

    protocolFee(overrides?: CallOverrides): Promise<BigNumber>;

    "protocolFee()"(overrides?: CallOverrides): Promise<BigNumber>;

    protocolFeeTo(overrides?: CallOverrides): Promise<BigNumber>;

    "protocolFeeTo()"(overrides?: CallOverrides): Promise<BigNumber>;

    setIpfsHash(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setIpfsHash(bytes32)"(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setName(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setName(bytes32)"(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    threshold(overrides?: CallOverrides): Promise<BigNumber>;

    "threshold()"(overrides?: CallOverrides): Promise<BigNumber>;

    totalCuratorFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalCuratorFunding()"(overrides?: CallOverrides): Promise<BigNumber>;

    totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptedToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "acceptedToken()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    bToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "bToken()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    back(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "back(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    backersWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "backersWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    beneficiary(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "beneficiary()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "cToken()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    curate(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "curate(uint256)"(
      _amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    curatorFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "curatorFee()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    curatorsWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "curatorsWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    deadline(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "deadline()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    funded(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "funded()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "initialize((uint256,bytes32,bytes32,bytes32,address),(uint256,uint256,address,address),uint256,uint256,address,address,address)"(
      _metaData: {
        id: BigNumberish;
        name: BytesLike;
        ipfsHash: BytesLike;
        cwUrl: BytesLike;
        creator: string;
      },
      _pData: {
        threshold: BigNumberish;
        deadline: BigNumberish;
        beneficiary: string;
        acceptedToken: string;
      },
      _curatorFee: BigNumberish,
      _protocolFee: BigNumberish,
      _protocolFeeTo: string,
      _bToken: string,
      _cToken: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    lockedWithdraw(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "lockedWithdraw()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    metaData(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "metaData()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    protocolFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "protocolFee()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    protocolFeeTo(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "protocolFeeTo()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setIpfsHash(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setIpfsHash(bytes32)"(
      _ipfsHash: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setName(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setName(bytes32)"(
      _name: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    threshold(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "threshold()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    totalCuratorFunding(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "totalCuratorFunding()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    totalFunding(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "totalFunding()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
