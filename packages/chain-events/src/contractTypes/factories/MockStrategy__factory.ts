/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  BigNumberish,
  Contract,
  ContractFactory,
  Overrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { MockStrategy } from "../MockStrategy";

export class MockStrategy__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _token: string,
    _yieldAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockStrategy> {
    return super.deploy(
      _token,
      _yieldAmount,
      overrides || {}
    ) as Promise<MockStrategy>;
  }
  getDeployTransaction(
    _token: string,
    _yieldAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_token, _yieldAmount, overrides || {});
  }
  attach(address: string): MockStrategy {
    return super.attach(address) as MockStrategy;
  }
  connect(signer: Signer): MockStrategy__factory {
    return super.connect(signer) as MockStrategy__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockStrategy {
    return new Contract(address, _abi, signerOrProvider) as MockStrategy;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_yieldAmount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_backer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_backedAmount",
        type: "uint256",
      },
    ],
    name: "redeem",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
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
        name: "_beneficiary",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_backedAmount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
    ],
    name: "withdrawAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawableQueue",
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
    inputs: [],
    name: "yieldAmount",
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
  "0x60a060405234801561001057600080fd5b506040516107f33803806107f383398101604081905261002f9161004a565b60609190911b6001600160601b031916608052600055610082565b6000806040838503121561005c578182fd5b82516001600160a01b0381168114610072578283fd5b6020939093015192949293505050565b60805160601c61073e6100b560003960008181610134015281816101f00152818161027001526102d0015261073e6000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063b6b55f251161005b578063b6b55f25146100f4578063f3fef3a314610107578063fa09e6301461011a578063fc0c546a1461012f57600080fd5b80631e9a69501461008d57806370a08231146100b557806395edc0a5146100e3578063a04f6639146100eb575b600080fd5b6100a061009b3660046105e3565b61016e565b60405190151581526020015b60405180910390f35b6100d56100c33660046105c9565b60016020526000908152604090205481565b6040519081526020016100ac565b6000546100d5565b6100d560005481565b6100a061010236600461062c565b610221565b6100a06101153660046105e3565b61024f565b61012d6101283660046105c9565b6102a4565b005b6101567f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016100ac565b336000908152600160205260408120546101be5760405162461bcd60e51b815260206004820152600c60248201526b5a45524f2042414c414e434560a01b60448201526064015b60405180910390fd5b33600090815260016020526040812080548492906101dd9084906106ab565b9091555061021790506001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016848461030a565b5060015b92915050565b33600090815260016020526040812080548391908390610242908490610693565b9091555060019392505050565b6000805461025f5750600061021b565b600054610298906001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690859061030a565b50506000805550600190565b6000805433825260016020526040909120546102f79183916102c69190610693565b6001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016919061030a565b5033600090815260016020526040812055565b604080516001600160a01b038416602482015260448082018490528251808303909101815260649091019091526020810180516001600160e01b031663a9059cbb60e01b17905261035c908490610361565b505050565b60006103b6826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166104339092919063ffffffff16565b80519091501561035c57808060200190518101906103d4919061060c565b61035c5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b60648201526084016101b5565b6060610442848460008561044c565b90505b9392505050565b6060824710156104ad5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b60648201526084016101b5565b843b6104fb5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016101b5565b600080866001600160a01b031685876040516105179190610644565b60006040518083038185875af1925050503d8060008114610554576040519150601f19603f3d011682016040523d82523d6000602084013e610559565b606091505b5091509150610569828286610574565b979650505050505050565b60608315610583575081610445565b8251156105935782518084602001fd5b8160405162461bcd60e51b81526004016101b59190610660565b80356001600160a01b03811681146105c457600080fd5b919050565b6000602082840312156105da578081fd5b610445826105ad565b600080604083850312156105f5578081fd5b6105fe836105ad565b946020939093013593505050565b60006020828403121561061d578081fd5b81518015158114610445578182fd5b60006020828403121561063d578081fd5b5035919050565b600082516106568184602087016106c2565b9190910192915050565b602081526000825180602084015261067f8160408501602087016106c2565b601f01601f19169190910160400192915050565b600082198211156106a6576106a66106f2565b500190565b6000828210156106bd576106bd6106f2565b500390565b60005b838110156106dd5781810151838201526020016106c5565b838111156106ec576000848401525b50505050565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220fed0c5ab65e57c899ae2cb203bcb6d60185f7a4f4349dc50fc8f07e73cce966e64736f6c63430008040033";
