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

import type { Executor } from "../Executor";

export class Executor__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    admin: string,
    delay: BigNumberish,
    gracePeriod: BigNumberish,
    minimumDelay: BigNumberish,
    maximumDelay: BigNumberish,
    propositionThreshold: BigNumberish,
    voteDuration: BigNumberish,
    voteDifferential: BigNumberish,
    minimumQuorum: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Executor> {
    return super.deploy(
      admin,
      delay,
      gracePeriod,
      minimumDelay,
      maximumDelay,
      propositionThreshold,
      voteDuration,
      voteDifferential,
      minimumQuorum,
      overrides || {}
    ) as Promise<Executor>;
  }
  getDeployTransaction(
    admin: string,
    delay: BigNumberish,
    gracePeriod: BigNumberish,
    minimumDelay: BigNumberish,
    maximumDelay: BigNumberish,
    propositionThreshold: BigNumberish,
    voteDuration: BigNumberish,
    voteDifferential: BigNumberish,
    minimumQuorum: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      admin,
      delay,
      gracePeriod,
      minimumDelay,
      maximumDelay,
      propositionThreshold,
      voteDuration,
      voteDifferential,
      minimumQuorum,
      overrides || {}
    );
  }
  attach(address: string): Executor {
    return super.attach(address) as Executor;
  }
  connect(signer: Signer): Executor__factory {
    return super.connect(signer) as Executor__factory;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Executor {
    return new Contract(address, _abi, signerOrProvider) as Executor;
  }
}

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "delay",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "gracePeriod",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumDelay",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumDelay",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "propositionThreshold",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "voteDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "voteDifferential",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimumQuorum",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "actionHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
    ],
    name: "CancelledAction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "actionHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "resultData",
        type: "bytes",
      },
    ],
    name: "ExecutedAction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
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
        indexed: false,
        internalType: "uint256",
        name: "delay",
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
        indexed: false,
        internalType: "address",
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
        indexed: false,
        internalType: "bytes32",
        name: "actionHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
    ],
    name: "QueuedAction",
    type: "event",
  },
  {
    inputs: [],
    name: "GRACE_PERIOD",
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
    name: "MAXIMUM_DELAY",
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
    name: "MINIMUM_DELAY",
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
    name: "MINIMUM_QUORUM",
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
    name: "ONE_HUNDRED_WITH_PRECISION",
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
    name: "PROPOSITION_THRESHOLD",
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
    name: "VOTE_DIFFERENTIAL",
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
    name: "VOTING_DURATION",
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
    name: "acceptAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
    ],
    name: "cancelTransaction",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
    ],
    name: "executeTransaction",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAdmin",
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
    name: "getDelay",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
    ],
    name: "getMinimumPropositionPowerNeeded",
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
        name: "votingSupply",
        type: "uint256",
      },
    ],
    name: "getMinimumVotingPowerNeeded",
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
    name: "getPendingAdmin",
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
        name: "actionHash",
        type: "bytes32",
      },
    ],
    name: "isActionQueued",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "isProposalOverGracePeriod",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "isProposalPassed",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
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
    name: "isPropositionPowerEnough",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "isQuorumValid",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
    ],
    name: "isVoteDifferentialValid",
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
        name: "target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "signature",
        type: "string",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "executionTime",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "withDelegatecall",
        type: "bool",
      },
    ],
    name: "queueTransaction",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "delay",
        type: "uint256",
      },
    ],
    name: "setDelay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newPendingAdmin",
        type: "address",
      },
    ],
    name: "setPendingAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
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
    name: "validateCreatorOfProposal",
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
        internalType: "contract IAaveGovernanceV2",
        name: "governance",
        type: "address",
      },
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
    name: "validateProposalCancellation",
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
    stateMutability: "payable",
    type: "receive",
  },
];

const _bytecode =
  "0x6101606040523480156200001257600080fd5b506040516200219a3803806200219a833981016040819052620000359162000159565b838383838c8c8c8c8c818410156200006a5760405162461bcd60e51b81526004016200006190620001ed565b60405180910390fd5b808411156200008d5760405162461bcd60e51b8152600401620000619062000224565b6002849055600080546001600160a01b0319166001600160a01b038716179055608083905260a082905260c08190526040517f948b1f6a42ee138b7e34058ba85a37f716d55ff25ff05a763f15bed6a04c8d2c90620000ee9086906200025b565b60405180910390a17f71614071b88dee5e0b2ae578a9dd7b2ebbe9ae832ba419dc0242cd065a290b6c85604051620001279190620001d9565b60405180910390a150505060e09590955250610100929092526101205261014052506200026498505050505050505050565b60008060008060008060008060006101208a8c03121562000178578485fd5b89516001600160a01b03811681146200018f578586fd5b8099505060208a0151975060408a0151965060608a0151955060808a0151945060a08a0151935060c08a0151925060e08a015191506101008a015190509295985092959850929598565b6001600160a01b0391909116815260200190565b6020808252601a908201527f44454c41595f53484f525445525f5448414e5f4d494e494d554d000000000000604082015260600190565b60208082526019908201527f44454c41595f4c4f4e4745525f5448414e5f4d4158494d554d00000000000000604082015260600190565b90815260200190565b60805160a05160c05160e051610100516101205161014051611ebf620002db60003980610ea65280610fbd5250806108fa5280610d2d525080610d5152508061106252806111cc52508061096d5280611325525080610eca52806112e5525080610a465280610f06528061119c5250611ebf6000f3fe6080604052600436106101a05760003560e01c8063a438d208116100ec578063d04681561161008a578063e50f840011610064578063e50f840014610445578063f48cb13414610465578063f670a5f914610485578063fd58afd4146104a5576101a7565b8063d0468156146103f0578063d0d9029814610405578063e177246e14610425576101a7565b8063b1b43ae5116100c6578063b1b43ae514610391578063b1fc8796146103a6578063c1a287e2146103c6578063cebc9a82146103db576101a7565b8063a438d20814610347578063ace432091461035c578063b159beac1461037c576101a7565b806366121042116101595780637d645fab116101335780637d645fab146102dd5780638902ab65146102f25780638d8fe2e3146103125780639125fb5814610332576101a7565b8063661210421461027b5780636e9960c31461029b5780637aa50080146102bd576101a7565b806306fbb3ab146101ac5780630e18b681146101e25780631d73fd6d146101f95780631dc40b511461021b57806331a7bc411461023b5780634dd18bf51461025b576101a7565b366101a757005b600080fd5b3480156101b857600080fd5b506101cc6101c736600461180c565b6104ba565b6040516101d99190611af2565b60405180910390f35b3480156101ee57600080fd5b506101f76104e0565b005b34801561020557600080fd5b5061020e61056a565b6040516101d99190611afd565b34801561022757600080fd5b5061020e61023636600461171a565b610570565b34801561024757600080fd5b506101cc6102563660046117cc565b61063c565b34801561026757600080fd5b506101f76102763660046116e2565b610652565b34801561028757600080fd5b506101cc6102963660046117cc565b6106c7565b3480156102a757600080fd5b506102b06107d0565b6040516101d99190611a71565b3480156102c957600080fd5b506101cc6102d836600461180c565b6107df565b3480156102e957600080fd5b5061020e61096b565b61030561030036600461171a565b61098f565b6040516101d99190611b86565b34801561031e57600080fd5b5061020e61032d36600461171a565b610c42565b34801561033e57600080fd5b5061020e610d2b565b34801561035357600080fd5b5061020e610d4f565b34801561036857600080fd5b506101cc61037736600461180c565b610d73565b34801561038857600080fd5b5061020e610ea4565b34801561039d57600080fd5b5061020e610ec8565b3480156103b257600080fd5b506101cc6103c13660046117b4565b610eec565b3480156103d257600080fd5b5061020e610f04565b3480156103e757600080fd5b5061020e610f28565b3480156103fc57600080fd5b506102b0610f2e565b34801561041157600080fd5b506101cc6104203660046117cc565b610f3d565b34801561043157600080fd5b506101f76104403660046117b4565b610f52565b34801561045157600080fd5b5061020e6104603660046117b4565b610faf565b34801561047157600080fd5b5061020e61048036600461180c565b610fe1565b34801561049157600080fd5b506101cc6104a036600461180c565b611103565b3480156104b157600080fd5b5061020e6111ca565b60006104c68383610d73565b80156104d757506104d783836107df565b90505b92915050565b6001546001600160a01b031633146105135760405162461bcd60e51b815260040161050a90611b99565b60405180910390fd5b60008054336001600160a01b031991821681179092556001805490911690556040517f71614071b88dee5e0b2ae578a9dd7b2ebbe9ae832ba419dc0242cd065a290b6c9161056091611a71565b60405180910390a1565b61271081565b600080546001600160a01b0316331461059b5760405162461bcd60e51b815260040161050a90611c65565b60008787878787876040516020016105b896959493929190611a9e565b60408051601f19818403018152828252805160209182012060008181526003909252919020805460ff1916905591506001600160a01b038916907f87c481aa909c37502caa37394ab791c26b68fa4fa5ae56de104de36444ae9069906106299084908b908b908b908b908b90611b06565b60405180910390a2979650505050505050565b60006106498484846106c7565b15949350505050565b3330146106715760405162461bcd60e51b815260040161050a90611d82565b600180546001600160a01b0319166001600160a01b0383161790556040517f69d78e38a01985fbb1462961809b4b2d65531bc93b2b94037f3334b82ca4a756906106bc908390611a71565b60405180910390a150565b600080846001600160a01b03166306be3e8e6040518163ffffffff1660e01b815260040160206040518083038186803b15801561070357600080fd5b505afa158015610717573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061073b91906116fe565b90506107478584610fe1565b604051631420edcb60e31b81526001600160a01b0383169063a1076e58906107759088908890600401611a85565b60206040518083038186803b15801561078d57600080fd5b505afa1580156107a1573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107c591906119e0565b101595945050505050565b6000546001600160a01b031690565b60006107e9611408565b604051633656de2160e01b81526001600160a01b03851690633656de2190610815908690600401611afd565b60006040518083038186803b15801561082d57600080fd5b505afa158015610841573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526108699190810190611837565b90506000816101e001516001600160a01b0316637a71f9d78361010001516040518263ffffffff1660e01b81526004016108a39190611afd565b60206040518083038186803b1580156108bb57600080fd5b505afa1580156108cf573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108f391906119e0565b90506109437f000000000000000000000000000000000000000000000000000000000000000061093d836109376127108761018001516111ee90919063ffffffff16565b90611247565b90611289565b610961826109376127108661016001516111ee90919063ffffffff16565b1195945050505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000546060906001600160a01b031633146109bc5760405162461bcd60e51b815260040161050a90611c65565b60008787878787876040516020016109d996959493929190611a9e565b60408051601f1981840301815291815281516020928301206000818152600390935291205490915060ff16610a205760405162461bcd60e51b815260040161050a90611cbb565b83421015610a405760405162461bcd60e51b815260040161050a90611bc8565b610a6a847f0000000000000000000000000000000000000000000000000000000000000000611289565b421115610a895760405162461bcd60e51b815260040161050a90611c8c565b6000818152600360205260409020805460ff191690558551606090610aaf575084610adb565b868051906020012086604051602001610ac9929190611a24565b60405160208183030381529060405290505b600060608515610b685789341015610b055760405162461bcd60e51b815260040161050a90611d54565b8a6001600160a01b031683604051610b1d9190611a55565b600060405180830381855af49150503d8060008114610b58576040519150601f19603f3d011682016040523d82523d6000602084013e610b5d565b606091505b509092509050610bca565b8a6001600160a01b03168a84604051610b819190611a55565b60006040518083038185875af1925050503d8060008114610bbe576040519150601f19603f3d011682016040523d82523d6000602084013e610bc3565b606091505b5090925090505b81610be75760405162461bcd60e51b815260040161050a90611ce6565b8a6001600160a01b03167f97825080b472fa91fe888b62ec128814d60dec546a2dafb955e50923f4a1b7e7858c8c8c8c8c88604051610c2c9796959493929190611b25565b60405180910390a29a9950505050505050505050565b600080546001600160a01b03163314610c6d5760405162461bcd60e51b815260040161050a90611c65565b600254610c7b904290611289565b831015610c9a5760405162461bcd60e51b815260040161050a90611bf7565b6000878787878787604051602001610cb796959493929190611a9e565b60408051601f19818403018152828252805160209182012060008181526003909252919020805460ff1916600117905591506001600160a01b038916907f2191aed4c4733c76e08a9e7e1da0b8d87fa98753f22df49231ddc66e0f05f022906106299084908b908b908b908b908b90611b06565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000610d7d611408565b604051633656de2160e01b81526001600160a01b03851690633656de2190610da9908690600401611afd565b60006040518083038186803b158015610dc157600080fd5b505afa158015610dd5573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f19168201604052610dfd9190810190611837565b90506000816101e001516001600160a01b0316637a71f9d78361010001516040518263ffffffff1660e01b8152600401610e379190611afd565b60206040518083038186803b158015610e4f57600080fd5b505afa158015610e63573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610e8791906119e0565b9050610e9281610faf565b82610160015110159250505092915050565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b60008181526003602052604090205460ff165b919050565b7f000000000000000000000000000000000000000000000000000000000000000081565b60025490565b6001546001600160a01b031690565b6000610f4a8484846106c7565b949350505050565b333014610f715760405162461bcd60e51b815260040161050a90611d82565b610f7a816112e3565b60028190556040517f948b1f6a42ee138b7e34058ba85a37f716d55ff25ff05a763f15bed6a04c8d2c906106bc908390611afd565b60006104da612710610937847f00000000000000000000000000000000000000000000000000000000000000006111ee565b600080836001600160a01b03166306be3e8e6040518163ffffffff1660e01b815260040160206040518083038186803b15801561101d57600080fd5b505afa158015611031573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061105591906116fe565b9050610f4a6127106109377f0000000000000000000000000000000000000000000000000000000000000000846001600160a01b031663f6b50203886040518263ffffffff1660e01b81526004016110ad9190611afd565b60206040518083038186803b1580156110c557600080fd5b505afa1580156110d9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906110fd91906119e0565b906111ee565b600061110d611408565b604051633656de2160e01b81526001600160a01b03851690633656de2190611139908690600401611afd565b60006040518083038186803b15801561115157600080fd5b505afa158015611165573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261118d9190810190611837565b6101408101519091506111c0907f0000000000000000000000000000000000000000000000000000000000000000611289565b4211949350505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000826111fd575060006104da565b8282028284828161120a57fe5b04146104d75760405162461bcd60e51b8152600401808060200182810382526021815260200180611e696021913960400191505060405180910390fd5b60006104d783836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250611366565b6000828201838110156104d7576040805162461bcd60e51b815260206004820152601b60248201527f536166654d6174683a206164646974696f6e206f766572666c6f770000000000604482015290519081900360640190fd5b7f00000000000000000000000000000000000000000000000000000000000000008110156113235760405162461bcd60e51b815260040161050a90611c2e565b7f00000000000000000000000000000000000000000000000000000000000000008111156113635760405162461bcd60e51b815260040161050a90611d1d565b50565b600081836113f25760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156113b757818101518382015260200161139f565b50505050905090810190601f1680156113e45780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385816113fe57fe5b0495945050505050565b6040518061022001604052806000815260200160006001600160a01b0316815260200160006001600160a01b031681526020016060815260200160608152602001606081526020016060815260200160608152602001600081526020016000815260200160008152602001600081526020016000815260200160001515815260200160001515815260200160006001600160a01b03168152602001600080191681525090565b8051610eff81611e45565b600082601f8301126114c9578081fd5b81516114dc6114d782611dd5565b611db1565b8181529150602080830190848101818402860182018710156114fd57600080fd5b60005b8481101561152557815161151381611e45565b84529282019290820190600101611500565b505050505092915050565b600082601f830112611540578081fd5b815161154e6114d782611dd5565b81815291506020808301908481018184028601820187101561156f57600080fd5b60005b8481101561152557815161158581611e5a565b84529282019290820190600101611572565b600082601f8301126115a7578081fd5b81516115b56114d782611dd5565b818152915060208083019084810160005b84811015611525578151870188603f8201126115e157600080fd5b838101516115f16114d782611df3565b81815260408b8184860101111561160757600080fd5b61161683888401838701611e15565b508652505092820192908201906001016115c6565b600082601f83011261163b578081fd5b81516116496114d782611dd5565b81815291506020808301908481018184028601820187101561166a57600080fd5b60005b848110156115255781518452928201929082019060010161166d565b8051610eff81611e5a565b600082601f8301126116a4578081fd5b81356116b26114d782611df3565b91508082528360208285010111156116c957600080fd5b8060208401602084013760009082016020015292915050565b6000602082840312156116f3578081fd5b81356104d781611e45565b60006020828403121561170f578081fd5b81516104d781611e45565b60008060008060008060c08789031215611732578182fd5b863561173d81611e45565b955060208701359450604087013567ffffffffffffffff80821115611760578384fd5b61176c8a838b01611694565b95506060890135915080821115611781578384fd5b5061178e89828a01611694565b9350506080870135915060a08701356117a681611e5a565b809150509295509295509295565b6000602082840312156117c5578081fd5b5035919050565b6000806000606084860312156117e0578081fd5b83356117eb81611e45565b925060208401356117fb81611e45565b929592945050506040919091013590565b6000806040838503121561181e578182fd5b823561182981611e45565b946020939093013593505050565b600060208284031215611848578081fd5b815167ffffffffffffffff8082111561185f578283fd5b8184019150610220808387031215611875578384fd5b61187e81611db1565b905082518152611890602084016114ae565b60208201526118a1604084016114ae565b60408201526060830151828111156118b7578485fd5b6118c3878286016114b9565b6060830152506080830151828111156118da578485fd5b6118e68782860161162b565b60808301525060a0830151828111156118fd578485fd5b61190987828601611597565b60a08301525060c083015182811115611920578485fd5b61192c87828601611597565b60c08301525060e083015182811115611943578485fd5b61194f87828601611530565b60e083015250610100838101519082015261012080840151908201526101408084015190820152610160808401519082015261018080840151908201526101a0915061199c828401611689565b828201526101c091506119b0828401611689565b828201526101e091506119c48284016114ae565b9181019190915261020091820151918101919091529392505050565b6000602082840312156119f1578081fd5b5051919050565b60008151808452611a10816020860160208601611e15565b601f01601f19169290920160200192915050565b6001600160e01b0319831681528151600090611a47816004850160208701611e15565b919091016004019392505050565b60008251611a67818460208701611e15565b9190910192915050565b6001600160a01b0391909116815260200190565b6001600160a01b03929092168252602082015260400190565b600060018060a01b038816825286602083015260c06040830152611ac560c08301876119f8565b8281036060840152611ad781876119f8565b6080840195909552505090151560a090910152949350505050565b901515815260200190565b90815260200190565b600087825286602083015260c06040830152611ac560c08301876119f8565b600088825287602083015260e06040830152611b4460e08301886119f8565b8281036060840152611b5681886119f8565b905085608084015284151560a084015282810360c0840152611b7881856119f8565b9a9950505050505050505050565b6000602082526104d760208301846119f8565b60208082526015908201527427a7262cafa12cafa822a72224a723afa0a226a4a760591b604082015260600190565b602080825260159082015274151253515313d0d2d7d393d517d192539254d21151605a1b604082015260600190565b6020808252601d908201527f455845435554494f4e5f54494d455f554e444552455354494d41544544000000604082015260600190565b6020808252601a908201527f44454c41595f53484f525445525f5448414e5f4d494e494d554d000000000000604082015260600190565b6020808252600d908201526c27a7262cafa12cafa0a226a4a760991b604082015260600190565b60208082526015908201527411d49050d157d411549253d117d192539254d21151605a1b604082015260600190565b6020808252601190820152701050d51253d397d393d517d45551555151607a1b604082015260600190565b60208082526017908201527f4641494c45445f414354494f4e5f455845435554494f4e000000000000000000604082015260600190565b60208082526019908201527f44454c41595f4c4f4e4745525f5448414e5f4d4158494d554d00000000000000604082015260600190565b6020808252601490820152734e4f545f454e4f5547485f4d53475f56414c554560601b604082015260600190565b6020808252601590820152744f4e4c595f42595f544849535f54494d454c4f434b60581b604082015260600190565b60405181810167ffffffffffffffff81118282101715611dcd57fe5b604052919050565b600067ffffffffffffffff821115611de957fe5b5060209081020190565b600067ffffffffffffffff821115611e0757fe5b50601f01601f191660200190565b60005b83811015611e30578181015183820152602001611e18565b83811115611e3f576000848401525b50505050565b6001600160a01b038116811461136357600080fd5b801515811461136357600080fdfe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a2646970667358221220761796ad47c3b100675d0b295fc99b6d99f7e4678d0978e33eceedb0e8d0b4b664736f6c63430007050033";
