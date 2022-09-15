import { BigNumber } from "ethers";
import * as _ from "lodash";
import { Transaction } from "web3/eth/types";

export enum SolidityType {
  address = "address",
  uint256 = "uint256",
  uint128 = "uint128",
  uint64 = "uint64",
  uint32 = "uint32",
  uint8 = "uint8",
  uint = "uint",
  bytes32 = "bytes32",
  boolean = "bool",
  string = "string",
  bytes = "bytes",
  tuple = "tuple",
}

export enum SolidityInternalType {
  address_payable = "address payable",
  contract = "contract",
  enum = "enum",
  struct = "struct",
  address = "address",
  uint256 = "uint256",
  uint128 = "uint128",
  uint64 = "uint64",
  uint32 = "uint32",
  uint8 = "uint8",
  uint = "uint",
  bytes32 = "bytes32",
  boolean = "bool",
  string = "string",
  bytes = "bytes",
}

export enum SolidityStateMutability {
  pure = "pure",
  view = "view",
  nonpayable = "nonpayable",
  payable = "payable",
}

export type Address = string;
export type UInt = BigNumber;
export type Bytes32 = string;
export type TxHash = string;

export class AbiFunctionInput {
  public readonly internalType: string;
  public readonly name: string;
  public readonly type: SolidityType;
  constructor(internalType: string, name: string, type: SolidityType) {
      this.name = name;
      this.type = type;
      this.internalType = internalType;
  }
  static fromJSON(json) {
      return new AbiFunctionInput(json.internalType, json.name, json.type);
  }
}

export class AbiFunctionOutput {
    public readonly internalType: string;
    public readonly name: string;
    public readonly type: SolidityType;
    constructor(internalType: string, name: string, type: SolidityType) {
        this.name = name;
        this.type = type;
        this.internalType = internalType;
    }
    static fromJSON(json) {
        return new AbiFunctionOutput(json.internalType, json.name, json.type);
    }
}

export class AbiFunction {
    public readonly inputs: AbiFunctionInput[];
    public readonly name: string;
    public readonly outputs: AbiFunctionOutput[];
    public readonly stateMutability: SolidityStateMutability;
    public readonly type: SolidityType;
    constructor(inputs: AbiFunctionInput[], name: string, outputs: AbiFunctionOutput[],
      stateMutability: SolidityStateMutability, type: SolidityType) {
        this.name = name;
        this.type = type;
        this.inputs = inputs;
        this.outputs = outputs;
        this.stateMutability = stateMutability;
    }
    static fromJSON(json) {
        return new AbiFunction(json.name, json.type, json.inputs, json.outputs,
          json.stateMutability);
    }
}

export class AbiEventInput {
  public readonly indexed: boolean;
  public readonly internalType: string;
  public readonly name: string;
  public readonly type: SolidityType;
  constructor(indexed: boolean, internalType: string, name: string, type: SolidityType) {
      this.indexed = indexed;
      this.name = name;
      this.type = type;
      this.internalType = internalType;
  }
  static fromJSON(json) {
      return new AbiFunctionInput(json.internalType, json.name, json.type);
  }
}

export class AbiEvent {
  public anonymous: boolean;
  public inputs: AbiEventInput[];
  public name: string;
  public type: SolidityType;
  public constructor(anonymous: boolean, inputs: AbiEventInput[], name: string, type: SolidityType) {
    this.anonymous = anonymous;
    this.inputs = inputs;
    this.name = name;
    this.type = type;
  }
}

export enum Network {
    Mainnet = "Mainnet",
    Rinkeby = "Rinkeby",
    Ropsten = "Ropsten",
    Kovan = "Kovan",
    Goerli = "Goerli",
  }

export const networkIdToName = {
    1: Network.Mainnet,
    3: Network.Ropsten,
    4: Network.Rinkeby,
    5: Network.Goerli,
    42: Network.Kovan,
};

export const networkNameToId = {
    [Network.Mainnet]: 1,
    [Network.Ropsten]: 3,
    [Network.Rinkeby]: 4,
    [Network.Goerli]: 5,
    [Network.Kovan]: 42,
};



