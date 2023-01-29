/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Signer, Overrides } from "ethers";
import { Contract, ContractFactory } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";

import type { GovernanceStrategy } from "../GovernanceStrategy";

export class GovernanceStrategy__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    aave: string,
    stkAave: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<GovernanceStrategy> {
    return super.deploy(
      aave,
      stkAave,
      overrides || {}
    ) as Promise<GovernanceStrategy>;
  }
  getDeployTransaction(
    aave: string,
    stkAave: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(aave, stkAave, overrides || {});
  }
  attach(address: string): GovernanceStrategy {
    return super.attach(address) as GovernanceStrategy;
  }
  connect(signer: Signer): GovernanceStrategy__factory {
    return super.connect(signer) as GovernanceStrategy__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): GovernanceStrategy {
    return new Contract(address, _abi, signerOrProvider) as GovernanceStrategy;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "aave",
        type: "address",
      },
      {
        internalType: "address",
        name: "stkAave",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AAVE",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "STK_AAVE",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getPropositionPowerAt",
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
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getTotalPropositionSupplyAt",
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
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getTotalVotingSupplyAt",
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
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getVotingPowerAt",
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
  "0x60c060405234801561001057600080fd5b5060405161050738038061050783398101604081905261002f91610069565b6001600160601b0319606092831b8116608052911b1660a05261009b565b80516001600160a01b038116811461006457600080fd5b919050565b6000806040838503121561007b578182fd5b6100848361004d565b91506100926020840161004d565b90509250929050565b60805160601c60a05160601c6104356100d260003980610132528061021b52508060e8528061017c52806102bb52506104356000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806348ccda3c146100675780637a71f9d714610085578063a1076e58146100a5578063bdf2878d146100b8578063eaeded5f146100c0578063f6b50203146100d3575b600080fd5b61006f6100e6565b60405161007c91906103b3565b60405180910390f35b610098610093366004610383565b61010a565b60405161007c91906103f6565b6100986100b336600461034d565b61011b565b61006f610130565b6100986100ce36600461034d565b610154565b6100986100e1366004610383565b610162565b7f000000000000000000000000000000000000000000000000000000000000000081565b600061011582610162565b92915050565b600061012983836001610201565b9392505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b600061012983836000610201565b604051630981b24d60e41b81526000906001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063981b24d0906101b19085906004016103f6565b60206040518083038186803b1580156101c957600080fd5b505afa1580156101dd573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610115919061039b565b60405163c2ffbb9160e01b81526000906001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063c2ffbb9190610254908790879087906004016103c7565b60206040518083038186803b15801561026c57600080fd5b505afa158015610280573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102a4919061039b565b60405163c2ffbb9160e01b81526001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000169063c2ffbb91906102f4908890889088906004016103c7565b60206040518083038186803b15801561030c57600080fd5b505afa158015610320573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610344919061039b565b01949350505050565b6000806040838503121561035f578182fd5b82356001600160a01b0381168114610375578283fd5b946020939093013593505050565b600060208284031215610394578081fd5b5035919050565b6000602082840312156103ac578081fd5b5051919050565b6001600160a01b0391909116815260200190565b6001600160a01b03841681526020810183905260608101600283106103e857fe5b826040830152949350505050565b9081526020019056fea26469706673582212200b3c1c6efd0da91caec4d0e1cb4bad53708d49150e4645a05e6c634acb3e29eb64736f6c63430007050033";
