/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Signer, Overrides } from "ethers";
import { Contract, ContractFactory } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";

import type { CWToken } from "../CWToken";

export class CWToken__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CWToken> {
    return super.deploy(overrides || {}) as Promise<CWToken>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CWToken {
    return super.attach(address) as CWToken;
  }
  connect(signer: Signer): CWToken__factory {
    return super.connect(signer) as CWToken__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CWToken {
    return new Contract(address, _abi, signerOrProvider) as CWToken;
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
        name: "_token",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isBToken",
        type: "bool",
      },
      {
        internalType: "address",
        name: "_minter",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
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
];

const _bytecode =
  "0x60806040526006805460ff60a01b1916905534801561001d57600080fd5b506112058061002d6000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c806342966c681161009757806395d89b411161006657806395d89b4114610209578063a457c2d714610211578063a9059cbb14610224578063dd62ed3e1461023757600080fd5b806342966c68146101a75780634888a7d1146101ba57806370a08231146101cd57806379cc6790146101f657600080fd5b806323b872dd116100d357806323b872dd1461014d578063313ce56714610160578063395093511461017f57806340c10f191461019257600080fd5b806306fdde03146100fa578063095ea7b31461011857806318160ddd1461013b575b600080fd5b610102610270565b60405161010f91906110d6565b60405180910390f35b61012b610126366004610f48565b6102fe565b604051901515815260200161010f565b6002545b60405190815260200161010f565b61012b61015b366004610ec5565b610314565b60045461016d9060ff1681565b60405160ff909116815260200161010f565b61012b61018d366004610f48565b610366565b6101a56101a0366004610f48565b61039d565b005b6101a56101b536600461101a565b61045c565b6101a56101c8366004610f00565b610469565b61013f6101db366004610e72565b6001600160a01b031660009081526020819052604090205490565b6101a5610204366004610f48565b610832565b6101026108d0565b61012b61021f366004610f48565b6108dd565b61012b610232366004610f48565b610914565b61013f610245366004610e93565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6003805461027d90611168565b80601f01602080910402602001604051908101604052809291908181526020018280546102a990611168565b80156102f65780601f106102cb576101008083540402835291602001916102f6565b820191906000526020600020905b8154815290600101906020018083116102d957829003601f168201915b505050505081565b600061030b338484610921565b50600192915050565b6000610321848484610a46565b6001600160a01b03841660009081526001602090815260408083203380855292529091205461035c918691610357908690611121565b610921565b5060019392505050565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161030b918590610357908690611109565b600654600160a01b900460ff166103fb5760405162461bcd60e51b815260206004820152601860248201527f4357543a20544f4b454e5f554e494e495449414c495a4544000000000000000060448201526064015b60405180910390fd5b6006546001600160a01b0316331461044e5760405162461bcd60e51b815260206004820152601660248201527510d5d50e8815539055551213d49256915117d352539560521b60448201526064016103f2565b6104588282610bb1565b5050565b6104663382610c91565b50565b6001600160a01b0383166104b45760405162461bcd60e51b815260206004820152601260248201527121abaa1d1024a72b20a624a22faa27a5a2a760711b60448201526064016103f2565b600654600160a01b900460ff161561050e5760405162461bcd60e51b815260206004820152601860248201527f4357543a20414c52454144595f494e495449414c495a4544000000000000000060448201526064016103f2565b60008261053457604051806040016040528060018152602001604360f81b81525061054f565b604051806040016040528060018152602001602160f91b8152505b6001600160a01b03851673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee146105ed57846001600160a01b03166306fdde036040518163ffffffff1660e01b815260040160006040518083038186803b1580156105ac57600080fd5b505afa1580156105c0573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526105e89190810190610f71565b61060f565b60405180604001604052806008815260200167457468657265756d60c01b8152505b604051602001610620929190611082565b604051602081830303815290604052905060008361065757604051806040016040528060018152602001604360f81b815250610672565b604051806040016040528060018152602001602160f91b8152505b6001600160a01b03861673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1461071057856001600160a01b03166395d89b416040518163ffffffff1660e01b815260040160006040518083038186803b1580156106cf57600080fd5b505afa1580156106e3573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261070b9190810190610f71565b61072d565b6040518060400160405280600381526020016208aa8960eb1b8152505b60405160200161073e929190611053565b60408051601f19818403018152919052905060006001600160a01b03861673eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee146107ec57856001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b1580156107af57600080fd5b505afa1580156107c3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107e79190611032565b6107ef565b60125b600680546001600160a01b0319166001600160a01b0387161790559050610817838383610d7d565b50506006805460ff60a01b1916600160a01b17905550505050565b6001600160a01b0382166000908152600160209081526040808320338452909152902054818110156108b25760405162461bcd60e51b8152602060048201526024808201527f45524332303a206275726e20616d6f756e74206578636565647320616c6c6f77604482015263616e636560e01b60648201526084016103f2565b6108c183336103578585611121565b6108cb8383610c91565b505050565b6005805461027d90611168565b3360008181526001602090815260408083206001600160a01b0387168452909152812054909161030b918590610357908690611121565b600061030b338484610a46565b6001600160a01b0383166109835760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b60648201526084016103f2565b6001600160a01b0382166109e45760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b60648201526084016103f2565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92591015b60405180910390a3505050565b6001600160a01b038316610aaa5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b60648201526084016103f2565b6001600160a01b038216610b0c5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b60648201526084016103f2565b6001600160a01b038316600090815260208190526040902054610b30908290611121565b6001600160a01b038085166000908152602081905260408082209390935590841681522054610b60908290611109565b6001600160a01b038381166000818152602081815260409182902094909455518481529092918616917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9101610a39565b6001600160a01b038216610c075760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f20616464726573730060448201526064016103f2565b8060026000828254610c199190611109565b90915550506001600160a01b03821660009081526020819052604081208054839290610c46908490611109565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906020015b60405180910390a35050565b6001600160a01b038216610cf15760405162461bcd60e51b815260206004820152602160248201527f45524332303a206275726e2066726f6d20746865207a65726f206164647265736044820152607360f81b60648201526084016103f2565b6001600160a01b038216600090815260208190526040902054610d15908290611121565b6001600160a01b038316600090815260208190526040902055600254610d3c908290611121565b6002556040518181526000906001600160a01b038416907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610c85565b8251610d90906003906020860190610dbd565b508151610da4906005906020850190610dbd565b506004805460ff191660ff929092169190911790555050565b828054610dc990611168565b90600052602060002090601f016020900481019282610deb5760008555610e31565b82601f10610e0457805160ff1916838001178555610e31565b82800160010185558215610e31579182015b82811115610e31578251825591602001919060010190610e16565b50610e3d929150610e41565b5090565b5b80821115610e3d5760008155600101610e42565b80356001600160a01b0381168114610e6d57600080fd5b919050565b600060208284031215610e83578081fd5b610e8c82610e56565b9392505050565b60008060408385031215610ea5578081fd5b610eae83610e56565b9150610ebc60208401610e56565b90509250929050565b600080600060608486031215610ed9578081fd5b610ee284610e56565b9250610ef060208501610e56565b9150604084013590509250925092565b600080600060608486031215610f14578283fd5b610f1d84610e56565b925060208401358015158114610f31578283fd5b9150610f3f60408501610e56565b90509250925092565b60008060408385031215610f5a578182fd5b610f6383610e56565b946020939093013593505050565b600060208284031215610f82578081fd5b815167ffffffffffffffff80821115610f99578283fd5b818401915084601f830112610fac578283fd5b815181811115610fbe57610fbe6111b9565b604051601f8201601f19908116603f01168101908382118183101715610fe657610fe66111b9565b81604052828152876020848701011115610ffe578586fd5b61100f836020830160208801611138565b979650505050505050565b60006020828403121561102b578081fd5b5035919050565b600060208284031215611043578081fd5b815160ff81168114610e8c578182fd5b60008351611065818460208801611138565b835190830190611079818360208801611138565b01949350505050565b62021ab960ed1b8152600083516110a0816003850160208801611138565b8351908301906110b7816003840160208801611138565b65102a37b5b2b760d11b60039290910191820152600901949350505050565b60208152600082518060208401526110f5816040850160208701611138565b601f01601f19169190910160400192915050565b6000821982111561111c5761111c6111a3565b500190565b600082821015611133576111336111a3565b500390565b60005b8381101561115357818101518382015260200161113b565b83811115611162576000848401525b50505050565b600181811c9082168061117c57607f821691505b6020821081141561119d57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fdfea26469706673582212205fd5240670a132787e480eba87821d3734dd5048a57297726666b6610da1ceb964736f6c63430008040033";
