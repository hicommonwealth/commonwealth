/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";

import type { AaveTokenV2Mock } from "../AaveTokenV2Mock";

export class AaveTokenV2Mock__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<AaveTokenV2Mock> {
    return super.deploy(overrides || {}) as Promise<AaveTokenV2Mock>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): AaveTokenV2Mock {
    return super.attach(address) as AaveTokenV2Mock;
  }
  connect(signer: Signer): AaveTokenV2Mock__factory {
    return super.connect(signer) as AaveTokenV2Mock__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AaveTokenV2Mock {
    return new Contract(address, _abi, signerOrProvider) as AaveTokenV2Mock;
  }
}

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "DelegateChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "DelegatedPowerChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DELEGATE_BY_TYPE_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DELEGATE_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "EIP712_REVISION",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PERMIT_TYPEHASH",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "REVISION",
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
    name: "_aaveGovernance",
    outputs: [
      {
        internalType: "contract ITransferHook",
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
        name: "",
        type: "address",
      },
    ],
    name: "_nonces",
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
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "_votingSnapshots",
    outputs: [
      {
        internalType: "uint128",
        name: "blockNumber",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "value",
        type: "uint128",
      },
    ],
    stateMutability: "view",
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
    name: "_votingSnapshotsCounts",
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
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
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
        name: "account",
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
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
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
        name: "delegatee",
        type: "address",
      },
    ],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "delegateBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "delegateByType",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "delegateByTypeBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "getDelegateeByType",
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
      {
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "getPowerAtBlock",
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
        internalType: "enum IGovernancePowerDelegationToken.DelegationType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "getPowerCurrent",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
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
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "minter",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
    name: "totalSupplyAt",
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
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
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
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
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
];

const _bytecode =
  "0x608060405260006006553480156200001657600080fd5b50604080518082018252600a81526920b0bb32902a37b5b2b760b11b6020808301918252835180850190945260048452634141564560e01b908401528151919291620000659160039162000091565b5080516200007b90600490602084019062000091565b50506005805460ff19166012179055506200013d565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282620000c9576000855562000114565b82601f10620000e457805160ff191683800117855562000114565b8280016001018555821562000114579182015b8281111562000114578251825591602001919060010190620000f7565b506200012292915062000126565b5090565b5b8082111562000122576000815560010162000127565b611ff5806200014d6000396000f3fe608060405234801561001057600080fd5b50600436106101f05760003560e01c80638129fc1c1161010f578063c2ffbb91116100a2578063dc937e1c11610071578063dc937e1c14610669578063dd62ed3e14610698578063dde43cba146106c6578063f713d8a8146106ce576101f0565b8063c2ffbb9114610594578063c3863ada146105c9578063c3cda520146105d1578063d505accf14610618576101f0565b8063a9059cbb116100de578063a9059cbb1461050b578063aa9fbe0214610537578063b2f4201d1461053f578063b9844d8d1461056e576101f0565b80638129fc1c146104b257806395d89b41146104ba578063981b24d0146104c2578063a457c2d7146104df576101f0565b806340c10f19116101875780636f50458d116101565780636f50458d1461041357806370a082311461045e57806378160376146104845780637bb73c971461048c576101f0565b806340c10f191461035c57806341cbf54a1461038a5780635b3cc0cf146103925780635c19a95c146103ed576101f0565b806330adf81f116101c357806330adf81f14610302578063313ce5671461030a5780633644e515146103285780633950935114610330576101f0565b806306fdde03146101f5578063095ea7b31461027257806318160ddd146102b257806323b872dd146102cc575b600080fd5b6101fd61071f565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561023757818101518382015260200161021f565b50505050905090810190601f1680156102645780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61029e6004803603604081101561028857600080fd5b506001600160a01b0381351690602001356107b5565b604080519115158252519081900360200190f35b6102ba6107d3565b60408051918252519081900360200190f35b61029e600480360360608110156102e257600080fd5b506001600160a01b038135811691602081013590911690604001356107d9565b6102ba610860565b610312610884565b6040805160ff9092168252519081900360200190f35b6102ba61088d565b61029e6004803603604081101561034657600080fd5b506001600160a01b038135169060200135610893565b6103886004803603604081101561037257600080fd5b506001600160a01b0381351690602001356108e1565b005b6102ba6108ef565b6103be600480360360408110156103a857600080fd5b506001600160a01b038135169060200135610913565b60405180836001600160801b03168152602001826001600160801b031681526020019250505060405180910390f35b6103886004803603602081101561040357600080fd5b50356001600160a01b0316610944565b6104426004803603604081101561042957600080fd5b5080356001600160a01b0316906020013560ff1661095f565b604080516001600160a01b039092168252519081900360200190f35b6102ba6004803603602081101561047457600080fd5b50356001600160a01b0316610981565b6101fd61099c565b6102ba600480360360208110156104a257600080fd5b50356001600160a01b03166109b9565b6103886109cb565b6101fd610a1c565b6102ba600480360360208110156104d857600080fd5b5035610a7d565b61029e600480360360408110156104f557600080fd5b506001600160a01b038135169060200135610a87565b61029e6004803603604081101561052157600080fd5b506001600160a01b038135169060200135610aef565b6102ba610b03565b6102ba6004803603604081101561055557600080fd5b5080356001600160a01b0316906020013560ff16610b27565b6102ba6004803603602081101561058457600080fd5b50356001600160a01b0316610b4f565b6102ba600480360360608110156105aa57600080fd5b5080356001600160a01b0316906020810135906040013560ff16610b61565b610442610b8a565b610388600480360360c08110156105e757600080fd5b506001600160a01b038135169060208101359060408101359060ff6060820135169060808101359060a00135610b99565b610388600480360360e081101561062e57600080fd5b506001600160a01b03813581169160208101359091169060408101359060608101359060ff6080820135169060a08101359060c00135610dbb565b6103886004803603604081101561067f57600080fd5b5080356001600160a01b0316906020013560ff16610ff7565b6102ba600480360360408110156106ae57600080fd5b506001600160a01b0381358116916020013516611002565b6102ba61102d565b610388600480360360e08110156106e457600080fd5b506001600160a01b038135169060ff602082013581169160408101359160608201359160808101359091169060a08101359060c00135611032565b60038054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156107ab5780601f10610780576101008083540402835291602001916107ab565b820191906000526020600020905b81548152906001019060200180831161078e57829003601f168201915b5050505050905090565b60006107c96107c2611265565b8484611269565b5060015b92915050565b60025490565b60006107e6848484611355565b610856846107f2611265565b61085185604051806060016040528060288152602001611efc602891396001600160a01b038a16600090815260016020526040812090610830611265565b6001600160a01b0316815260208101919091526040016000205491906114b0565b611269565b5060019392505050565b7f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c981565b60055460ff1690565b603d5481565b60006107c96108a0611265565b8461085185600160006108b1611265565b6001600160a01b03908116825260208083019390935260409182016000908120918c168152925290205490611547565b6108eb82826115a8565b5050565b7f9a9a49b990ba9bb39f8048c490a40ab25c18f55d208d5fbcf958261a9b48716d81565b603a6020908152600092835260408084209091529082529020546001600160801b0380821691600160801b90041682565b61095033826000611698565b61095c33826001611698565b50565b60008061096b836117a9565b9250505061097984826117e3565b949350505050565b6001600160a01b031660009081526020819052604090205490565b604051806040016040528060018152602001603160f81b81525081565b603b6020526000908152604090205481565b60006109d561180e565b90506006548111610a175760405162461bcd60e51b815260040180806020018281038252602e815260200180611f24602e913960400191505060405180910390fd5b600655565b60048054604080516020601f60026000196101006001881615020190951694909404938401819004810282018101909252828152606093909290918301828280156107ab5780601f10610780576101008083540402835291602001916107ab565b60006107cd6107d3565b60006107c9610a94611265565b8461085185604051806060016040528060258152602001611f9b6025913960016000610abe611265565b6001600160a01b03908116825260208083019390935260409182016000908120918d168152925290205491906114b0565b60006107c9610afc611265565b8484611355565b7f10d8d059343739efce7dad10d09f0806da52b252b3e6a7951920d2d6ec4102e581565b6000806000610b35846117a9565b5091509150610b4682828743611813565b95945050505050565b60396020526000908152604090205481565b6000806000610b6f846117a9565b5091509150610b8082828888611813565b9695505050505050565b603c546001600160a01b031681565b604080517f9a9a49b990ba9bb39f8048c490a40ab25c18f55d208d5fbcf958261a9b48716d6020808301919091526001600160a01b038916828401526060820188905260808083018890528351808403909101815260a083018452805190820120603d5461190160f01b60c085015260c284015260e2808401829052845180850390910181526101028401808652815191840191909120600091829052610122850180875281905260ff891661014286015261016285018890526101828501879052945191949390926001926101a280840193601f198301929081900390910190855afa158015610c8e573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610cea576040805162461bcd60e51b8152602060048201526011602482015270494e56414c49445f5349474e415455524560781b604482015290519081900360640190fd5b6001600160a01b03811660009081526039602052604090208054600181019091558814610d4e576040805162461bcd60e51b815260206004820152600d60248201526c494e56414c49445f4e4f4e434560981b604482015290519081900360640190fd5b86421115610d98576040805162461bcd60e51b815260206004820152601260248201527124a72b20a624a22fa2ac2824a920aa24a7a760711b604482015290519081900360640190fd5b610da4818a6000611698565b610db0818a6001611698565b505050505050505050565b6001600160a01b038716610e06576040805162461bcd60e51b815260206004820152600d60248201526c24a72b20a624a22fa7aba722a960991b604482015290519081900360640190fd5b83421115610e50576040805162461bcd60e51b815260206004820152601260248201527124a72b20a624a22fa2ac2824a920aa24a7a760711b604482015290519081900360640190fd5b6001600160a01b03808816600081815260396020908152604080832054603d5482517f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98186015280840196909652958c166060860152608085018b905260a0850181905260c08086018b90528251808703909101815260e08601835280519084012061190160f01b6101008701526101028601969096526101228086019690965281518086039096018652610142850180835286519684019690962093909552610162840180825283905260ff88166101828501526101a284018790526101c284018690525191926001926101e28083019392601f198301929081900390910190855afa158015610f65573d6000803e3d6000fd5b505050602060405103516001600160a01b0316896001600160a01b031614610fc8576040805162461bcd60e51b8152602060048201526011602482015270494e56414c49445f5349474e415455524560781b604482015290519081900360640190fd5b610fd3826001611547565b6001600160a01b038a16600090815260396020526040902055610db0898989611269565b6108eb338383611698565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b600281565b60007f10d8d059343739efce7dad10d09f0806da52b252b3e6a7951920d2d6ec4102e58888600181111561106257fe5b604080516020808201959095526001600160a01b039093168382015260608301919091526080820189905260a08083018990528151808403909101815260c083018252805190840120603d5461190160f01b60e085015260e2840152610102808401829052825180850390910181526101228401808452815191860191909120600091829052610142850180855281905260ff8a1661016286015261018285018990526101a285018890529251919550919391926001926101c2808301939192601f198301929081900390910190855afa158015611144573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b0381166111a0576040805162461bcd60e51b8152602060048201526011602482015270494e56414c49445f5349474e415455524560781b604482015290519081900360640190fd5b6001600160a01b03811660009081526039602052604090208054600181019091558814611204576040805162461bcd60e51b815260206004820152600d60248201526c494e56414c49445f4e4f4e434560981b604482015290519081900360640190fd5b8642111561124e576040805162461bcd60e51b815260206004820152601260248201527124a72b20a624a22fa2ac2824a920aa24a7a760711b604482015290519081900360640190fd5b611259818b8b611698565b50505050505050505050565b3390565b6001600160a01b0383166112ae5760405162461bcd60e51b8152600401808060200182810382526024815260200180611f776024913960400191505060405180910390fd5b6001600160a01b0382166112f35760405162461bcd60e51b8152600401808060200182810382526022815260200180611eb46022913960400191505060405180910390fd5b6001600160a01b03808416600081815260016020908152604080832094871680845294825291829020859055815185815291517f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259281900390910190a3505050565b6001600160a01b03831661139a5760405162461bcd60e51b8152600401808060200182810382526025815260200180611f526025913960400191505060405180910390fd5b6001600160a01b0382166113df5760405162461bcd60e51b8152600401808060200182810382526023815260200180611e916023913960400191505060405180910390fd5b6113ea838383611a2e565b61142781604051806060016040528060268152602001611ed6602691396001600160a01b03861660009081526020819052604090205491906114b0565b6001600160a01b0380851660009081526020819052604080822093909355908416815220546114569082611547565b6001600160a01b038084166000818152602081815260409182902094909455805185815290519193928716927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a3505050565b6000818484111561153f5760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156115045781810151838201526020016114ec565b50505050905090810190601f1680156115315780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b505050900390565b6000828201838110156115a1576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b9392505050565b6001600160a01b038216611603576040805162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015290519081900360640190fd5b61160f60008383611a2e565b60025461161c9082611547565b6002556001600160a01b0382166000908152602081905260409020546116429082611547565b6001600160a01b0383166000818152602081815260408083209490945583518581529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35050565b6001600160a01b0382166116e7576040805162461bcd60e51b8152602060048201526011602482015270494e56414c49445f44454c45474154454560781b604482015290519081900360640190fd5b60006116f2826117a9565b92505050600061170185610981565b9050600061170f86846117e3565b6001600160a01b03878116600090815260208690526040902080546001600160a01b031916918816919091179055905061174b81868487611b21565b846001600160a01b0316866001600160a01b03167fe8d51c8e11bd570db1734c8ec775785330e77007feed45c43b608ef33ff914bd866040518082600181111561179157fe5b815260200191505060405180910390a3505050505050565b60008080808460018111156117ba57fe5b14156117d05750603a9150603b9050603e6117dc565b50603f91506040905060415b9193909250565b6001600160a01b03808316600090815260208390526040812054909116806115a157839150506107cd565b600290565b600043821115611861576040805162461bcd60e51b815260206004820152601460248201527324a72b20a624a22fa12627a1a5afa72aa6a122a960611b604482015290519081900360640190fd5b6001600160a01b038316600090815260208590526040902054806118905761188884610981565b915050610979565b6001600160a01b038416600090815260208781526040808320600019850184529091529020546001600160801b03168310611903576001600160a01b038416600090815260208781526040808320600019909401835292905220546001600160801b03600160801b909104169050610979565b6001600160a01b0384166000908152602087815260408083208380529091529020546001600160801b031683101561193f576000915050610979565b600060001982015b818111156119f157600282820304810361195f611e79565b506001600160a01b038716600090815260208a815260408083208484528252918290208251808401909352546001600160801b03808216808552600160801b90920416918301919091528714156119c957602001516001600160801b031694506109799350505050565b80516001600160801b03168711156119e3578193506119ea565b6001820392505b5050611947565b506001600160a01b0385166000908152602088815260408083209383529290522054600160801b90046001600160801b0316915050949350505050565b6000611a3b84603e6117e3565b90506000611a4a84603e6117e3565b9050611a598282856000611b21565b6000611a668660416117e3565b90506000611a758660416117e3565b9050611a848282876001611b21565b603c546001600160a01b03168015611b1757806001600160a01b0316634a3931498989896040518463ffffffff1660e01b815260040180846001600160a01b03168152602001836001600160a01b031681526020018281526020019350505050600060405180830381600087803b158015611afe57600080fd5b505af1158015611b12573d6000803e3d6000fd5b505050505b5050505050505050565b826001600160a01b0316846001600160a01b03161415611b4057611d2a565b600080611b4c836117a9565b5090925090506001600160a01b03861615611c3f576001600160a01b0386166000908152602082905260408120548015611bbd576001600160a01b03881660009081526020858152604080832060001985018452909152902054600160801b90046001600160801b03169150611bc9565b611bc688610981565b91505b611bdf84848a85611bda818c611d30565b611d72565b6001600160a01b0388167fa0a19463ee116110c9b282012d9b65cc5522dc38a9520340cbaf3142e550127f611c148489611d30565b8760405180838152602001826001811115611c2b57fe5b81526020019250505060405180910390a250505b6001600160a01b03851615611d27576001600160a01b0385166000908152602082905260408120548015611caa576001600160a01b03871660009081526020858152604080832060001985018452909152902054600160801b90046001600160801b03169150611cb6565b611cb387610981565b91505b611cc784848985611bda818c611547565b6001600160a01b0387167fa0a19463ee116110c9b282012d9b65cc5522dc38a9520340cbaf3142e550127f611cfc8489611547565b8760405180838152602001826001811115611d1357fe5b81526020019250505060405180910390a250505b50505b50505050565b60006115a183836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506114b0565b6001600160a01b03831660009081526020858152604080832054918890529091204391908115801590611dc3575060001982016000908152602082905260409020546001600160801b038481169116145b15611df8576000198201600090815260208290526040902080546001600160801b03808716600160801b029116179055611b17565b6040805180820182526001600160801b038086168252868116602080840191825260008781528682528581209451855493518516600160801b029085166fffffffffffffffffffffffffffffffff1990941693909317909316919091179092556001600160a01b038916815290899052206001830190555050505050505050565b60408051808201909152600080825260208201529056fe45524332303a207472616e7366657220746f20746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e6365436f6e747261637420696e7374616e63652068617320616c7265616479206265656e20696e697469616c697a656445524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa264697066735822122012b47fdc939fc8d50edf884dab3716a0426b45c8d488a8cf5c9e8258220f51b064736f6c63430007050033";
