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
  EventFilter,
  Contract
} from "ethers";
import type { BytesLike } from "@ethersproject/bytes";
import type { Listener, Provider } from "@ethersproject/providers";
import type { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface IProjectBaseInterface extends ethers.utils.Interface {
  functions: {
    "back(uint256)": FunctionFragment;
    "backersWithdraw()": FunctionFragment;
    "beneficiaryWithdraw()": FunctionFragment;
    "funded()": FunctionFragment;
    "lockedWithdraw()": FunctionFragment;
    "metaData()": FunctionFragment;
    "projectData()": FunctionFragment;
    "protocolData()": FunctionFragment;
    "setIpfsHash(bytes32)": FunctionFragment;
    "setName(bytes32)": FunctionFragment;
    "setUrl(bytes32)": FunctionFragment;
    "totalFunding()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "back", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "backersWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "beneficiaryWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "funded", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "lockedWithdraw",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "metaData", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "projectData",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "protocolData",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setIpfsHash",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "setName", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "setUrl", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "totalFunding",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "back", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "backersWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "beneficiaryWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "funded", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "lockedWithdraw",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "metaData", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "projectData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "protocolData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setIpfsHash",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setName", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setUrl", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "totalFunding",
    data: BytesLike
  ): Result;

  events: {
    "Back(address,address,uint256)": EventFragment;
    "Failed()": EventFragment;
    "ProjectDataChange(bytes32,bytes32,bytes32)": EventFragment;
    "Succeeded(uint256,uint256)": EventFragment;
    "Withdraw(address,address,uint256,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Back"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Failed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ProjectDataChange"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Succeeded"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdraw"): EventFragment;
}

export class IProjectBase extends Contract {
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

  interface: IProjectBaseInterface;

  functions: {
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

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    funded(overrides?: CallOverrides): Promise<[boolean]>;

    "funded()"(overrides?: CallOverrides): Promise<[boolean]>;

    lockedWithdraw(overrides?: CallOverrides): Promise<[boolean]>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<[boolean]>;

    metaData(
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string, string, string] & {
          id: BigNumber;
          name: string;
          ipfsHash: string;
          url: string;
          creator: string;
        }
      ]
    >;

    "metaData()"(
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string, string, string] & {
          id: BigNumber;
          name: string;
          ipfsHash: string;
          url: string;
          creator: string;
        }
      ]
    >;

    projectData(
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, BigNumber, string, string] & {
          threshold: BigNumber;
          deadline: BigNumber;
          beneficiary: string;
          acceptedToken: string;
        }
      ]
    >;

    "projectData()"(
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, BigNumber, string, string] & {
          threshold: BigNumber;
          deadline: BigNumber;
          beneficiary: string;
          acceptedToken: string;
        }
      ]
    >;

    protocolData(
      overrides?: CallOverrides
    ): Promise<[[number, string] & { fee: number; feeTo: string }]>;

    "protocolData()"(
      overrides?: CallOverrides
    ): Promise<[[number, string] & { fee: number; feeTo: string }]>;

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

    setUrl(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "setUrl(bytes32)"(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    totalFunding(overrides?: CallOverrides): Promise<[BigNumber]>;

    "totalFunding()"(overrides?: CallOverrides): Promise<[BigNumber]>;
  };

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

  beneficiaryWithdraw(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "beneficiaryWithdraw()"(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  funded(overrides?: CallOverrides): Promise<boolean>;

  "funded()"(overrides?: CallOverrides): Promise<boolean>;

  lockedWithdraw(overrides?: CallOverrides): Promise<boolean>;

  "lockedWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

  metaData(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string, string, string] & {
      id: BigNumber;
      name: string;
      ipfsHash: string;
      url: string;
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
      url: string;
      creator: string;
    }
  >;

  projectData(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, string, string] & {
      threshold: BigNumber;
      deadline: BigNumber;
      beneficiary: string;
      acceptedToken: string;
    }
  >;

  "projectData()"(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber, string, string] & {
      threshold: BigNumber;
      deadline: BigNumber;
      beneficiary: string;
      acceptedToken: string;
    }
  >;

  protocolData(
    overrides?: CallOverrides
  ): Promise<[number, string] & { fee: number; feeTo: string }>;

  "protocolData()"(
    overrides?: CallOverrides
  ): Promise<[number, string] & { fee: number; feeTo: string }>;

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

  setUrl(
    _url: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "setUrl(bytes32)"(
    _url: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

  "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    back(_amount: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    "back(uint256)"(
      _amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    backersWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "backersWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    beneficiaryWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "beneficiaryWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    funded(overrides?: CallOverrides): Promise<boolean>;

    "funded()"(overrides?: CallOverrides): Promise<boolean>;

    lockedWithdraw(overrides?: CallOverrides): Promise<boolean>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<boolean>;

    metaData(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string, string, string] & {
        id: BigNumber;
        name: string;
        ipfsHash: string;
        url: string;
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
        url: string;
        creator: string;
      }
    >;

    projectData(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, string] & {
        threshold: BigNumber;
        deadline: BigNumber;
        beneficiary: string;
        acceptedToken: string;
      }
    >;

    "projectData()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber, string, string] & {
        threshold: BigNumber;
        deadline: BigNumber;
        beneficiary: string;
        acceptedToken: string;
      }
    >;

    protocolData(
      overrides?: CallOverrides
    ): Promise<[number, string] & { fee: number; feeTo: string }>;

    "protocolData()"(
      overrides?: CallOverrides
    ): Promise<[number, string] & { fee: number; feeTo: string }>;

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

    setUrl(_url: BytesLike, overrides?: CallOverrides): Promise<void>;

    "setUrl(bytes32)"(
      _url: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    Back(
      sender: string | null,
      token: string | null,
      amount: null
    ): TypedEventFilter<
      [string, string, BigNumber],
      { sender: string; token: string; amount: BigNumber }
    >;

    Failed(): TypedEventFilter<[], {}>;

    ProjectDataChange(
      name: null,
      oldData: null,
      newData: null
    ): TypedEventFilter<
      [string, string, string],
      { name: string; oldData: string; newData: string }
    >;

    Succeeded(
      timestamp: null,
      amount: null
    ): TypedEventFilter<
      [BigNumber, BigNumber],
      { timestamp: BigNumber; amount: BigNumber }
    >;

    Withdraw(
      sender: string | null,
      token: string | null,
      amount: null,
      withdrawalType: null
    ): TypedEventFilter<
      [string, string, BigNumber, string],
      {
        sender: string;
        token: string;
        amount: BigNumber;
        withdrawalType: string;
      }
    >;
  };

  estimateGas: {
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

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    funded(overrides?: CallOverrides): Promise<BigNumber>;

    "funded()"(overrides?: CallOverrides): Promise<BigNumber>;

    lockedWithdraw(overrides?: CallOverrides): Promise<BigNumber>;

    "lockedWithdraw()"(overrides?: CallOverrides): Promise<BigNumber>;

    metaData(overrides?: CallOverrides): Promise<BigNumber>;

    "metaData()"(overrides?: CallOverrides): Promise<BigNumber>;

    projectData(overrides?: CallOverrides): Promise<BigNumber>;

    "projectData()"(overrides?: CallOverrides): Promise<BigNumber>;

    protocolData(overrides?: CallOverrides): Promise<BigNumber>;

    "protocolData()"(overrides?: CallOverrides): Promise<BigNumber>;

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

    setUrl(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "setUrl(bytes32)"(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    totalFunding(overrides?: CallOverrides): Promise<BigNumber>;

    "totalFunding()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
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

    beneficiaryWithdraw(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "beneficiaryWithdraw()"(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    funded(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "funded()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    lockedWithdraw(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "lockedWithdraw()"(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    metaData(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "metaData()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    projectData(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "projectData()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    protocolData(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "protocolData()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

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

    setUrl(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "setUrl(bytes32)"(
      _url: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    totalFunding(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "totalFunding()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
