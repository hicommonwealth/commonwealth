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

import type { Timelock } from "../Timelock";

export class Timelock__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    admin_: string,
    delay_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Timelock> {
    return super.deploy(admin_, delay_, overrides || {}) as Promise<Timelock>;
  }
  getDeployTransaction(
    admin_: string,
    delay_: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(admin_, delay_, overrides || {});
  }
  attach(address: string): Timelock {
    return super.attach(address) as Timelock;
  }
  connect(signer: Signer): Timelock__factory {
    return super.connect(signer) as Timelock__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Timelock {
    return new Contract(address, _abi, signerOrProvider) as Timelock;
  }
}

const _abi = [
  {
    constant: false,
    inputs: [
      {
        name: "target",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
      {
        name: "signature",
        type: "string",
      },
      {
        name: "data",
        type: "bytes",
      },
      {
        name: "eta",
        type: "uint256",
      },
    ],
    name: "executeTransaction",
    outputs: [
      {
        name: "",
        type: "bytes",
      },
    ],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "acceptAdmin",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "pendingAdmin",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "target",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
      {
        name: "signature",
        type: "string",
      },
      {
        name: "data",
        type: "bytes",
      },
      {
        name: "eta",
        type: "uint256",
      },
    ],
    name: "queueTransaction",
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "pendingAdmin_",
        type: "address",
      },
    ],
    name: "setPendingAdmin",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "target",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
      {
        name: "signature",
        type: "string",
      },
      {
        name: "data",
        type: "bytes",
      },
      {
        name: "eta",
        type: "uint256",
      },
    ],
    name: "cancelTransaction",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "delay",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "MAXIMUM_DELAY",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "MINIMUM_DELAY",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "GRACE_PERIOD",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "delay_",
        type: "uint256",
      },
    ],
    name: "setDelay",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    name: "queuedTransactions",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "admin",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "admin_",
        type: "address",
      },
      {
        name: "delay_",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "NewAdmin",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "newPendingAdmin",
        type: "address",
      },
    ],
    name: "NewPendingAdmin",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "newDelay",
        type: "uint256",
      },
    ],
    name: "NewDelay",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: true,
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        name: "eta",
        type: "uint256",
      },
    ],
    name: "CancelTransaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: true,
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        name: "eta",
        type: "uint256",
      },
    ],
    name: "ExecuteTransaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "txHash",
        type: "bytes32",
      },
      {
        indexed: true,
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        name: "eta",
        type: "uint256",
      },
    ],
    name: "QueueTransaction",
    type: "event",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516040806118fe8339810180604052604081101561003057600080fd5b5080516020909101516202a300811015610095576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603781526020018061188f6037913960400191505060405180910390fd5b62278d008111156100f1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260388152602001806118c66038913960400191505060405180910390fd5b600080546001600160a01b039093166001600160a01b03199093169290921790915560025561176a806101256000396000f3fe6080604052600436106100c25760003560e01c80636a42b8f81161007f578063c1a287e211610059578063c1a287e2146105dd578063e177246e146105f2578063f2b065371461061c578063f851a4401461065a576100c2565b80636a42b8f81461059e5780637d645fab146105b3578063b1b43ae5146105c8576100c2565b80630825f38f146100c45780630e18b68114610279578063267822471461028e5780633a66f901146102bf5780634dd18bf51461041e578063591fcdfe14610451575b005b610204600480360360a08110156100da57600080fd5b6001600160a01b0382351691602081013591810190606081016040820135600160201b81111561010957600080fd5b82018360208201111561011b57600080fd5b803590602001918460018302840111600160201b8311171561013c57600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295949360208101935035915050600160201b81111561018e57600080fd5b8201836020820111156101a057600080fd5b803590602001918460018302840111600160201b831117156101c157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250929550509135925061066f915050565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561023e578181015183820152602001610226565b50505050905090810190601f16801561026b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561028557600080fd5b506100c2610b9d565b34801561029a57600080fd5b506102a3610c3c565b604080516001600160a01b039092168252519081900360200190f35b3480156102cb57600080fd5b5061040c600480360360a08110156102e257600080fd5b6001600160a01b0382351691602081013591810190606081016040820135600160201b81111561031157600080fd5b82018360208201111561032357600080fd5b803590602001918460018302840111600160201b8311171561034457600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295949360208101935035915050600160201b81111561039657600080fd5b8201836020820111156103a857600080fd5b803590602001918460018302840111600160201b831117156103c957600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295505091359250610c4b915050565b60408051918252519081900360200190f35b34801561042a57600080fd5b506100c26004803603602081101561044157600080fd5b50356001600160a01b0316610f62565b34801561045d57600080fd5b506100c2600480360360a081101561047457600080fd5b6001600160a01b0382351691602081013591810190606081016040820135600160201b8111156104a357600080fd5b8201836020820111156104b557600080fd5b803590602001918460018302840111600160201b831117156104d657600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295949360208101935035915050600160201b81111561052857600080fd5b82018360208201111561053a57600080fd5b803590602001918460018302840111600160201b8311171561055b57600080fd5b91908080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152509295505091359250610ff3915050565b3480156105aa57600080fd5b5061040c6112ac565b3480156105bf57600080fd5b5061040c6112b2565b3480156105d457600080fd5b5061040c6112b9565b3480156105e957600080fd5b5061040c6112c0565b3480156105fe57600080fd5b506100c26004803603602081101561061557600080fd5b50356112c7565b34801561062857600080fd5b506106466004803603602081101561063f57600080fd5b50356113c5565b604080519115158252519081900360200190f35b34801561066657600080fd5b506102a36113da565b6000546060906001600160a01b031633146106be57604051600160e51b62461bcd0281526004018080602001828103825260388152602001806114526038913960400191505060405180910390fd5b6000868686868660405160200180866001600160a01b03166001600160a01b031681526020018581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b8381101561072d578181015183820152602001610715565b50505050905090810190601f16801561075a5780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b8381101561078d578181015183820152602001610775565b50505050905090810190601f1680156107ba5780820380516001836020036101000a031916815260200191505b5060408051601f1981840301815291815281516020928301206000818152600390935291205490995060ff1615159750610830965050505050505057604051600160e51b62461bcd02815260040180806020018281038252603d8152602001806115a5603d913960400191505060405180910390fd5b826108396113e9565b101561087957604051600160e51b62461bcd0281526004018080602001828103825260458152602001806114f46045913960600191505060405180910390fd5b61088c836212750063ffffffff6113ed16565b6108946113e9565b11156108d457604051600160e51b62461bcd0281526004018080602001828103825260338152602001806114c16033913960400191505060405180910390fd5b6000818152600360205260409020805460ff19169055845160609015156108fc575083610989565b85805190602001208560405160200180836001600160e01b0319166001600160e01b031916815260040182805190602001908083835b602083106109515780518252601f199092019160209182019101610932565b6001836020036101000a0380198251168184511680821785525050505050509050019250505060405160208183030381529060405290505b60006060896001600160a01b031689846040518082805190602001908083835b602083106109c85780518252601f1990920191602091820191016109a9565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114610a2a576040519150601f19603f3d011682016040523d82523d6000602084013e610a2f565b606091505b5091509150811515610a7557604051600160e51b62461bcd02815260040180806020018281038252603d815260200180611688603d913960400191505060405180910390fd5b896001600160a01b0316847fa560e3198060a2f10670c1ec5b403077ea6ae93ca8de1c32b451dc1a943cd6e78b8b8b8b604051808581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b83811015610af2578181015183820152602001610ada565b50505050905090810190601f168015610b1f5780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b83811015610b52578181015183820152602001610b3a565b50505050905090810190601f168015610b7f5780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390a39998505050505050505050565b6001546001600160a01b03163314610be957604051600160e51b62461bcd0281526004018080602001828103825260388152602001806115e26038913960400191505060405180910390fd5b60008054336001600160a01b031991821617808355600180549092169091556040516001600160a01b03909116917f71614071b88dee5e0b2ae578a9dd7b2ebbe9ae832ba419dc0242cd065a290b6c91a2565b6001546001600160a01b031681565b600080546001600160a01b03163314610c9857604051600160e51b62461bcd0281526004018080602001828103825260368152602001806116526036913960400191505060405180910390fd5b610cb2600254610ca66113e9565b9063ffffffff6113ed16565b821015610cf357604051600160e51b62461bcd0281526004018080602001828103825260498152602001806116c56049913960600191505060405180910390fd5b6000868686868660405160200180866001600160a01b03166001600160a01b031681526020018581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b83811015610d62578181015183820152602001610d4a565b50505050905090810190601f168015610d8f5780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b83811015610dc2578181015183820152602001610daa565b50505050905090810190601f168015610def5780820380516001836020036101000a031916815260200191505b5097505050505050505060405160208183030381529060405280519060200120905060016003600083815260200190815260200160002060006101000a81548160ff021916908315150217905550866001600160a01b0316817f76e2796dc3a81d57b0e8504b647febcbeeb5f4af818e164f11eef8131a6a763f88888888604051808581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b83811015610eba578181015183820152602001610ea2565b50505050905090810190601f168015610ee75780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b83811015610f1a578181015183820152602001610f02565b50505050905090810190601f168015610f475780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390a39695505050505050565b333014610fa357604051600160e51b62461bcd02815260040180806020018281038252603881526020018061161a6038913960400191505060405180910390fd5b600180546001600160a01b0319166001600160a01b0383811691909117918290556040519116907f69d78e38a01985fbb1462961809b4b2d65531bc93b2b94037f3334b82ca4a75690600090a250565b6000546001600160a01b0316331461103f57604051600160e51b62461bcd02815260040180806020018281038252603781526020018061148a6037913960400191505060405180910390fd5b6000858585858560405160200180866001600160a01b03166001600160a01b031681526020018581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b838110156110ae578181015183820152602001611096565b50505050905090810190601f1680156110db5780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b8381101561110e5781810151838201526020016110f6565b50505050905090810190601f16801561113b5780820380516001836020036101000a031916815260200191505b5097505050505050505060405160208183030381529060405280519060200120905060006003600083815260200190815260200160002060006101000a81548160ff021916908315150217905550856001600160a01b0316817f2fffc091a501fd91bfbff27141450d3acb40fb8e6d8382b243ec7a812a3aaf8787878787604051808581526020018060200180602001848152602001838103835286818151815260200191508051906020019080838360005b838110156112065781810151838201526020016111ee565b50505050905090810190601f1680156112335780820380516001836020036101000a031916815260200191505b50838103825285518152855160209182019187019080838360005b8381101561126657818101518382015260200161124e565b50505050905090810190601f1680156112935780820380516001836020036101000a031916815260200191505b50965050505050505060405180910390a3505050505050565b60025481565b62278d0081565b6202a30081565b6212750081565b33301461130857604051600160e51b62461bcd02815260040180806020018281038252603181526020018061170e6031913960400191505060405180910390fd5b6202a30081101561134d57604051600160e51b62461bcd0281526004018080602001828103825260348152602001806115396034913960400191505060405180910390fd5b62278d0081111561139257604051600160e51b62461bcd02815260040180806020018281038252603881526020018061156d6038913960400191505060405180910390fd5b600281905560405181907f948b1f6a42ee138b7e34058ba85a37f716d55ff25ff05a763f15bed6a04c8d2c90600090a250565b60036020526000908152604090205460ff1681565b6000546001600160a01b031681565b4290565b60008282018381101561144a5760408051600160e51b62461bcd02815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b939250505056fe54696d656c6f636b3a3a657865637574655472616e73616374696f6e3a2043616c6c206d75737420636f6d652066726f6d2061646d696e2e54696d656c6f636b3a3a63616e63656c5472616e73616374696f6e3a2043616c6c206d75737420636f6d652066726f6d2061646d696e2e54696d656c6f636b3a3a657865637574655472616e73616374696f6e3a205472616e73616374696f6e206973207374616c652e54696d656c6f636b3a3a657865637574655472616e73616374696f6e3a205472616e73616374696f6e206861736e2774207375727061737365642074696d65206c6f636b2e54696d656c6f636b3a3a73657444656c61793a2044656c6179206d75737420657863656564206d696e696d756d2064656c61792e54696d656c6f636b3a3a73657444656c61793a2044656c6179206d757374206e6f7420657863656564206d6178696d756d2064656c61792e54696d656c6f636b3a3a657865637574655472616e73616374696f6e3a205472616e73616374696f6e206861736e2774206265656e207175657565642e54696d656c6f636b3a3a61636365707441646d696e3a2043616c6c206d75737420636f6d652066726f6d2070656e64696e6741646d696e2e54696d656c6f636b3a3a73657450656e64696e6741646d696e3a2043616c6c206d75737420636f6d652066726f6d2054696d656c6f636b2e54696d656c6f636b3a3a71756575655472616e73616374696f6e3a2043616c6c206d75737420636f6d652066726f6d2061646d696e2e54696d656c6f636b3a3a657865637574655472616e73616374696f6e3a205472616e73616374696f6e20657865637574696f6e2072657665727465642e54696d656c6f636b3a3a71756575655472616e73616374696f6e3a20457374696d6174656420657865637574696f6e20626c6f636b206d75737420736174697366792064656c61792e54696d656c6f636b3a3a73657444656c61793a2043616c6c206d75737420636f6d652066726f6d2054696d656c6f636b2ea165627a7a723058202de420f8ebfce56311d04ad4b9e961d9ffd08232232ca5f7a3c448a9a1c2af98002954696d656c6f636b3a3a636f6e7374727563746f723a2044656c6179206d75737420657863656564206d696e696d756d2064656c61792e54696d656c6f636b3a3a73657444656c61793a2044656c6179206d757374206e6f7420657863656564206d6178696d756d2064656c61792e";
