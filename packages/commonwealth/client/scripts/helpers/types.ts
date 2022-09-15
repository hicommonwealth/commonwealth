import { BigNumber } from "ethers";
import * as _ from "lodash";

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

export const networkIdToName = {
    1: "mainnet",
    3: "ropsten",
    4: "rinkeby",
    5: "goerli",
    42: "kovan",
};

export const networkNameToId = {
    "mainnet": 1,
    "ropsten": 3,
    "rinkeby": 4,
    "goerli": 5,
    "kovan": 42,
};

// Use Web3-Core Types For Most Things



