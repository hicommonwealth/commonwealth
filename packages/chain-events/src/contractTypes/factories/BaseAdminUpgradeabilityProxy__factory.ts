/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { BaseAdminUpgradeabilityProxy } from "../BaseAdminUpgradeabilityProxy";

export class BaseAdminUpgradeabilityProxy__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<BaseAdminUpgradeabilityProxy> {
    return super.deploy(
      overrides || {}
    ) as Promise<BaseAdminUpgradeabilityProxy>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): BaseAdminUpgradeabilityProxy {
    return super.attach(address) as BaseAdminUpgradeabilityProxy;
  }
  connect(signer: Signer): BaseAdminUpgradeabilityProxy__factory {
    return super.connect(signer) as BaseAdminUpgradeabilityProxy__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BaseAdminUpgradeabilityProxy {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as BaseAdminUpgradeabilityProxy;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "implementation",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610652806100206000396000f3fe60806040526004361061004a5760003560e01c80633659cfe6146100545780634f1ef286146100875780635c60da1b146101075780638f28397014610138578063f851a4401461016b575b610052610180565b005b34801561006057600080fd5b506100526004803603602081101561007757600080fd5b50356001600160a01b031661019a565b6100526004803603604081101561009d57600080fd5b6001600160a01b0382351691908101906040810160208201356401000000008111156100c857600080fd5b8201836020820111156100da57600080fd5b803590602001918460018302840111640100000000831117156100fc57600080fd5b5090925090506101d4565b34801561011357600080fd5b5061011c610281565b604080516001600160a01b039092168252519081900360200190f35b34801561014457600080fd5b506100526004803603602081101561015b57600080fd5b50356001600160a01b03166102be565b34801561017757600080fd5b5061011c610378565b6101886103a3565b610198610193610403565b610428565b565b6101a261044c565b6001600160a01b0316336001600160a01b031614156101c9576101c481610471565b6101d1565b6101d1610180565b50565b6101dc61044c565b6001600160a01b0316336001600160a01b03161415610274576101fe83610471565b6000836001600160a01b031683836040518083838082843760405192019450600093509091505080830381855af49150503d806000811461025b576040519150601f19603f3d011682016040523d82523d6000602084013e610260565b606091505b505090508061026e57600080fd5b5061027c565b61027c610180565b505050565b600061028b61044c565b6001600160a01b0316336001600160a01b031614156102b3576102ac610403565b90506102bb565b6102bb610180565b90565b6102c661044c565b6001600160a01b0316336001600160a01b031614156101c9576001600160a01b0381166103245760405162461bcd60e51b81526004018080602001828103825260368152602001806105ac6036913960400191505060405180910390fd5b7f7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f61034d61044c565b604080516001600160a01b03928316815291841660208301528051918290030190a16101c4816104b1565b600061038261044c565b6001600160a01b0316336001600160a01b031614156102b3576102ac61044c565b6103ab61044c565b6001600160a01b0316336001600160a01b031614156103fb5760405162461bcd60e51b815260040180806020018281038252603281526020018061057a6032913960400191505060405180910390fd5b610198610198565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc5490565b3660008037600080366000845af43d6000803e808015610447573d6000f35b3d6000fd5b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d61035490565b61047a816104d5565b6040516001600160a01b038216907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a250565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d610355565b6104de8161053d565b6105195760405162461bcd60e51b815260040180806020018281038252603b8152602001806105e2603b913960400191505060405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc55565b6000813f7fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47081811480159061057157508115155b94935050505056fe43616e6e6f742063616c6c2066616c6c6261636b2066756e6374696f6e2066726f6d207468652070726f78792061646d696e43616e6e6f74206368616e6765207468652061646d696e206f6620612070726f787920746f20746865207a65726f206164647265737343616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373a2646970667358221220cfe0ef50db6a668875331bc0482bd8a95b7b16befba4ad6e488800f28191bb9664736f6c63430007050033";
