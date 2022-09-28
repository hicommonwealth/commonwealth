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

export const factoryNicknameToCreateFunctionName = {
  "curated-factory-goerli": "createProject",
  "partybidfactory": "startParty",
  "gnosissafe": "fallback",
};

// Use Web3-Core Types For Most Things



