/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Signer, Overrides } from "ethers";
import { Contract, ContractFactory } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";

import type { MockERC20 } from "../MockERC20";

export class MockERC20__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    _tokenName: string,
    _tokenSymbol: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MockERC20> {
    return super.deploy(
      _tokenName,
      _tokenSymbol,
      overrides || {}
    ) as Promise<MockERC20>;
  }
  getDeployTransaction(
    _tokenName: string,
    _tokenSymbol: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _tokenName,
      _tokenSymbol,
      overrides || {}
    );
  }
  attach(address: string): MockERC20 {
    return super.attach(address) as MockERC20;
  }
  connect(signer: Signer): MockERC20__factory {
    return super.connect(signer) as MockERC20__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockERC20 {
    return new Contract(address, _abi, signerOrProvider) as MockERC20;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_tokenName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_tokenSymbol",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
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
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
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
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
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
    name: "MINTER_ROLE",
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
    name: "PAUSER_ROLE",
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
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
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
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "burnFrom",
    outputs: [],
    stateMutability: "nonpayable",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
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
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "getRoleMember",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleMemberCount",
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
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
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
    inputs: [
      {
        internalType: "address",
        name: "to",
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
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
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
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001e3d38038062001e3d8339810160408190526200003491620003a0565b8181818181600590805190602001906200005092919062000247565b5080516200006690600690602084019062000247565b50506007805460ff191690555062000080600033620000e2565b620000ac7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a633620000e2565b620000d87f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a33620000e2565b505050506200045a565b620000f982826200012560201b620009e91760201c565b600082815260016020908152604090912062000120918390620009f362000135821b17901c565b505050565b62000131828262000155565b5050565b60006200014c836001600160a01b038416620001f5565b90505b92915050565b6000828152602081815260408083206001600160a01b038516845290915290205460ff1662000131576000828152602081815260408083206001600160a01b03851684529091529020805460ff19166001179055620001b13390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b60008181526001830160205260408120546200023e575081546001818101845560008481526020808220909301849055845484825282860190935260409020919091556200014f565b5060006200014f565b828054620002559062000407565b90600052602060002090601f016020900481019282620002795760008555620002c4565b82601f106200029457805160ff1916838001178555620002c4565b82800160010185558215620002c4579182015b82811115620002c4578251825591602001919060010190620002a7565b50620002d2929150620002d6565b5090565b5b80821115620002d25760008155600101620002d7565b600082601f830112620002fe578081fd5b81516001600160401b03808211156200031b576200031b62000444565b604051601f8301601f19908116603f0116810190828211818310171562000346576200034662000444565b8160405283815260209250868385880101111562000362578485fd5b8491505b8382101562000385578582018301518183018401529082019062000366565b838211156200039657848385830101525b9695505050505050565b60008060408385031215620003b3578182fd5b82516001600160401b0380821115620003ca578384fd5b620003d886838701620002ed565b93506020850151915080821115620003ee578283fd5b50620003fd85828601620002ed565b9150509250929050565b600181811c908216806200041c57607f821691505b602082108114156200043e57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b6119d3806200046a6000396000f3fe608060405234801561001057600080fd5b50600436106101c45760003560e01c806370a08231116100f9578063a457c2d711610097578063d539139311610071578063d5391393146103af578063d547741f146103d6578063dd62ed3e146103e9578063e63ab1e91461042257600080fd5b8063a457c2d714610376578063a9059cbb14610389578063ca15c8731461039c57600080fd5b80639010d07c116100d35780639010d07c1461032857806391d148541461035357806395d89b4114610366578063a217fddf1461036e57600080fd5b806370a08231146102e457806379cc67901461030d5780638456cb591461032057600080fd5b8063313ce567116101665780633f4ba83a116101405780633f4ba83a146102ab57806340c10f19146102b357806342966c68146102c65780635c975abb146102d957600080fd5b8063313ce5671461027657806336568abe14610285578063395093511461029857600080fd5b806318160ddd116101a257806318160ddd1461021957806323b872dd1461022b578063248a9ca31461023e5780632f2ff15d1461026157600080fd5b806301ffc9a7146101c957806306fdde03146101f1578063095ea7b314610206575b600080fd5b6101dc6101d73660046117eb565b610449565b60405190151581526020015b60405180910390f35b6101f9610474565b6040516101e89190611888565b6101dc610214366004611767565b610506565b6004545b6040519081526020016101e8565b6101dc61023936600461172c565b61051c565b61021d61024c366004611790565b60009081526020819052604090206001015490565b61027461026f3660046117a8565b6105cb565b005b604051601281526020016101e8565b6102746102933660046117a8565b6105f2565b6101dc6102a6366004611767565b610614565b610274610650565b6102746102c1366004611767565b6106f6565b6102746102d4366004611790565b610799565b60075460ff166101dc565b61021d6102f23660046116e0565b6001600160a01b031660009081526002602052604090205490565b61027461031b366004611767565b6107a6565b610274610827565b61033b6103363660046117ca565b6108cb565b6040516001600160a01b0390911681526020016101e8565b6101dc6103613660046117a8565b6108ea565b6101f9610913565b61021d600081565b6101dc610384366004611767565b610922565b6101dc610397366004611767565b6109bb565b61021d6103aa366004611790565b6109c8565b61021d7f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a681565b6102746103e43660046117a8565b6109df565b61021d6103f73660046116fa565b6001600160a01b03918216600090815260036020908152604080832093909416825291909152205490565b61021d7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a81565b60006001600160e01b03198216635a05180f60e01b148061046e575061046e82610a08565b92915050565b6060600580546104839061194c565b80601f01602080910402602001604051908101604052809291908181526020018280546104af9061194c565b80156104fc5780601f106104d1576101008083540402835291602001916104fc565b820191906000526020600020905b8154815290600101906020018083116104df57829003601f168201915b5050505050905090565b6000610513338484610a3d565b50600192915050565b6000610529848484610b61565b6001600160a01b0384166000908152600360209081526040808320338452909152902054828110156105b35760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b6105c08533858403610a3d565b506001949350505050565b6105d58282610d3c565b60008281526001602052604090206105ed90826109f3565b505050565b6105fc8282610d62565b60008281526001602052604090206105ed9082610ddc565b3360008181526003602090815260408083206001600160a01b0387168452909152812054909161051391859061064b9086906118bb565b610a3d565b61067a7f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a336108ea565b6106ec5760405162461bcd60e51b815260206004820152603960248201527f45524332305072657365744d696e7465725061757365723a206d75737420686160448201527f76652070617573657220726f6c6520746f20756e70617573650000000000000060648201526084016105aa565b6106f4610df1565b565b6107207f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6336108ea565b61078b5760405162461bcd60e51b815260206004820152603660248201527f45524332305072657365744d696e7465725061757365723a206d7573742068616044820152751d99481b5a5b9d195c881c9bdb19481d1bc81b5a5b9d60521b60648201526084016105aa565b6107958282610e84565b5050565b6107a33382610f6f565b50565b60006107b283336103f7565b9050818110156108105760405162461bcd60e51b8152602060048201526024808201527f45524332303a206275726e20616d6f756e74206578636565647320616c6c6f77604482015263616e636560e01b60648201526084016105aa565b61081d8333848403610a3d565b6105ed8383610f6f565b6108517f65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a336108ea565b6108c35760405162461bcd60e51b815260206004820152603760248201527f45524332305072657365744d696e7465725061757365723a206d75737420686160448201527f76652070617573657220726f6c6520746f20706175736500000000000000000060648201526084016105aa565b6106f46110c9565b60008281526001602052604081206108e39083611144565b9392505050565b6000918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b6060600680546104839061194c565b3360009081526003602090815260408083206001600160a01b0386168452909152812054828110156109a45760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b60648201526084016105aa565b6109b13385858403610a3d565b5060019392505050565b6000610513338484610b61565b600081815260016020526040812061046e90611150565b6105fc828261115a565b6107958282611180565b60006108e3836001600160a01b038416611204565b60006001600160e01b03198216637965db0b60e01b148061046e57506301ffc9a760e01b6001600160e01b031983161461046e565b6001600160a01b038316610a9f5760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016105aa565b6001600160a01b038216610b005760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016105aa565b6001600160a01b0383811660008181526003602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038316610bc55760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016105aa565b6001600160a01b038216610c275760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016105aa565b610c32838383611253565b6001600160a01b03831660009081526002602052604090205481811015610caa5760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b60648201526084016105aa565b6001600160a01b03808516600090815260026020526040808220858503905591851681529081208054849290610ce19084906118bb565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610d2d91815260200190565b60405180910390a35b50505050565b600082815260208190526040902060010154610d58813361125e565b6105ed8383611180565b6001600160a01b0381163314610dd25760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084016105aa565b61079582826112c2565b60006108e3836001600160a01b038416611327565b60075460ff16610e3a5760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b60448201526064016105aa565b6007805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b6001600160a01b038216610eda5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016105aa565b610ee660008383611253565b8060046000828254610ef891906118bb565b90915550506001600160a01b03821660009081526002602052604081208054839290610f259084906118bb565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b6001600160a01b038216610fcf5760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b60648201526084016105aa565b610fdb82600083611253565b6001600160a01b0382166000908152600260205260409020548181101561104f5760405162461bcd60e51b815260206004820152602260248201527f45524332303a206275726e20616d6f756e7420657863656564732062616c616e604482015261636560f01b60648201526084016105aa565b6001600160a01b038316600090815260026020526040812083830390556004805484929061107e9084906118f2565b90915550506040518281526000906001600160a01b038516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3505050565b60075460ff161561110f5760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016105aa565b6007805460ff191660011790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258610e673390565b60006108e38383611444565b600061046e825490565b600082815260208190526040902060010154611176813361125e565b6105ed83836112c2565b61118a82826108ea565b610795576000828152602081815260408083206001600160a01b03851684529091529020805460ff191660011790556111c03390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b600081815260018301602052604081205461124b5750815460018181018455600084815260208082209093018490558454848252828601909352604090209190915561046e565b50600061046e565b6105ed83838361147c565b61126882826108ea565b61079557611280816001600160a01b031660146114e2565b61128b8360206114e2565b60405160200161129c929190611813565b60408051601f198184030181529082905262461bcd60e51b82526105aa91600401611888565b6112cc82826108ea565b15610795576000828152602081815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6000818152600183016020526040812054801561143a57600061134b6001836118f2565b855490915060009061135f906001906118f2565b90508181146113e057600086600001828154811061138d57634e487b7160e01b600052603260045260246000fd5b90600052602060002001549050808760000184815481106113be57634e487b7160e01b600052603260045260246000fd5b6000918252602080832090910192909255918252600188019052604090208390555b85548690806113ff57634e487b7160e01b600052603160045260246000fd5b60019003818190600052602060002001600090559055856001016000868152602001908152602001600020600090556001935050505061046e565b600091505061046e565b600082600001828154811061146957634e487b7160e01b600052603260045260246000fd5b9060005260206000200154905092915050565b60075460ff16156105ed5760405162461bcd60e51b815260206004820152602a60248201527f45524332305061757361626c653a20746f6b656e207472616e736665722077686044820152691a5b19481c185d5cd95960b21b60648201526084016105aa565b606060006114f18360026118d3565b6114fc9060026118bb565b67ffffffffffffffff81111561152257634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f19166020018201604052801561154c576020820181803683370190505b509050600360fc1b8160008151811061157557634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350600f60fb1b816001815181106115b257634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060006115d68460026118d3565b6115e19060016118bb565b90505b6001811115611675576f181899199a1a9b1b9c1cb0b131b232b360811b85600f166010811061162357634e487b7160e01b600052603260045260246000fd5b1a60f81b82828151811061164757634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a90535060049490941c9361166e81611935565b90506115e4565b5083156108e35760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e7460448201526064016105aa565b80356001600160a01b03811681146116db57600080fd5b919050565b6000602082840312156116f1578081fd5b6108e3826116c4565b6000806040838503121561170c578081fd5b611715836116c4565b9150611723602084016116c4565b90509250929050565b600080600060608486031215611740578081fd5b611749846116c4565b9250611757602085016116c4565b9150604084013590509250925092565b60008060408385031215611779578182fd5b611782836116c4565b946020939093013593505050565b6000602082840312156117a1578081fd5b5035919050565b600080604083850312156117ba578182fd5b82359150611723602084016116c4565b600080604083850312156117dc578182fd5b50508035926020909101359150565b6000602082840312156117fc578081fd5b81356001600160e01b0319811681146108e3578182fd5b7f416363657373436f6e74726f6c3a206163636f756e742000000000000000000081526000835161184b816017850160208801611909565b7001034b99036b4b9b9b4b733903937b6329607d1b601791840191820152835161187c816028840160208801611909565b01602801949350505050565b60208152600082518060208401526118a7816040850160208701611909565b601f01601f19169190910160400192915050565b600082198211156118ce576118ce611987565b500190565b60008160001904831182151516156118ed576118ed611987565b500290565b60008282101561190457611904611987565b500390565b60005b8381101561192457818101518382015260200161190c565b83811115610d365750506000910152565b60008161194457611944611987565b506000190190565b600181811c9082168061196057607f821691505b6020821081141561198157634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fdfea2646970667358221220cafb45a7aaf56de3064913dd3e9e5d5c6d493d6d4c193df6d2b51a329352805064736f6c63430008040033";
