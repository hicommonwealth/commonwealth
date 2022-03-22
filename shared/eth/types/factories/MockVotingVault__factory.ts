/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { MockVotingVault } from "../MockVotingVault";

export class MockVotingVault__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockVotingVault> {
    return super.deploy(overrides || {}) as Promise<MockVotingVault>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MockVotingVault {
    return super.attach(address) as MockVotingVault;
  }
  connect(signer: Signer): MockVotingVault__factory {
    return super.connect(signer) as MockVotingVault__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockVotingVault {
    return new Contract(address, _abi, signerOrProvider) as MockVotingVault;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "queryVotePower",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "setVotingPower",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "votingPower",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101ee806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063274b91a914610046578063c07473f614610072578063e91f3235146100a4575b600080fd5b61007061005436600461010d565b6001600160a01b03909116600090815260208190526040902055565b005b6100926100803660046100ec565b60006020819052908152604090205481565b60405190815260200160405180910390f35b6100926100b2366004610136565b5050506001600160a01b031660009081526020819052604090205490565b80356001600160a01b03811681146100e757600080fd5b919050565b6000602082840312156100fd578081fd5b610106826100d0565b9392505050565b6000806040838503121561011f578081fd5b610128836100d0565b946020939093013593505050565b6000806000806060858703121561014b578182fd5b610154856100d0565b935060208501359250604085013567ffffffffffffffff80821115610177578384fd5b818701915087601f83011261018a578384fd5b813581811115610198578485fd5b8860208285010111156101a9578485fd5b9598949750506020019450505056fea26469706673582212205aaf88e61a82533cdf30557c68465fc20c592df590bac4ad9e6d296468ae06bd64736f6c63430008040033";
