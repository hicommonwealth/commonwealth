"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernorCompatibilityBravo__factory = void 0;
const ethers_1 = require("ethers");
class GovernorCompatibilityBravo__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.GovernorCompatibilityBravo__factory = GovernorCompatibilityBravo__factory;
const _abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "ProposalCanceled",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "proposer",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                indexed: false,
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                indexed: false,
                internalType: "string[]",
                name: "signatures",
                type: "string[]",
            },
            {
                indexed: false,
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "startBlock",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "endBlock",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "string",
                name: "description",
                type: "string",
            },
        ],
        name: "ProposalCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "ProposalExecuted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "eta",
                type: "uint256",
            },
        ],
        name: "ProposalQueued",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "voter",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "support",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "weight",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "string",
                name: "reason",
                type: "string",
            },
        ],
        name: "VoteCast",
        type: "event",
    },
    {
        inputs: [],
        name: "BALLOT_TYPEHASH",
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
        name: "COUNTING_MODE",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "pure",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "cancel",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "support",
                type: "uint8",
            },
        ],
        name: "castVote",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "support",
                type: "uint8",
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
        name: "castVoteBySig",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                internalType: "uint8",
                name: "support",
                type: "uint8",
            },
            {
                internalType: "string",
                name: "reason",
                type: "string",
            },
        ],
        name: "castVoteWithReason",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                internalType: "bytes32",
                name: "descriptionHash",
                type: "bytes32",
            },
        ],
        name: "execute",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "execute",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "getActions",
        outputs: [
            {
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "string[]",
                name: "signatures",
                type: "string[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "voter",
                type: "address",
            },
        ],
        name: "getReceipt",
        outputs: [
            {
                components: [
                    {
                        internalType: "bool",
                        name: "hasVoted",
                        type: "bool",
                    },
                    {
                        internalType: "uint8",
                        name: "support",
                        type: "uint8",
                    },
                    {
                        internalType: "uint96",
                        name: "votes",
                        type: "uint96",
                    },
                ],
                internalType: "struct IGovernorCompatibilityBravo.Receipt",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
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
                name: "blockNumber",
                type: "uint256",
            },
        ],
        name: "getVotes",
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
                name: "proposalId",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "hasVoted",
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
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                internalType: "bytes32",
                name: "descriptionHash",
                type: "bytes32",
            },
        ],
        name: "hashProposal",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "pure",
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
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "proposalDeadline",
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
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "proposalEta",
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
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "proposalSnapshot",
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
        name: "proposalThreshold",
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
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "proposals",
        outputs: [
            {
                internalType: "uint256",
                name: "id",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "proposer",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "eta",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "startBlock",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "endBlock",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "forVotes",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "againstVotes",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "abstainVotes",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "canceled",
                type: "bool",
            },
            {
                internalType: "bool",
                name: "executed",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                internalType: "string",
                name: "description",
                type: "string",
            },
        ],
        name: "propose",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "string[]",
                name: "signatures",
                type: "string[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                internalType: "string",
                name: "description",
                type: "string",
            },
        ],
        name: "propose",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "targets",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "values",
                type: "uint256[]",
            },
            {
                internalType: "bytes[]",
                name: "calldatas",
                type: "bytes[]",
            },
            {
                internalType: "bytes32",
                name: "descriptionHash",
                type: "bytes32",
            },
        ],
        name: "queue",
        outputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "queue",
        outputs: [],
        stateMutability: "nonpayable",
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
        name: "quorum",
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
        name: "quorumVotes",
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
                name: "proposalId",
                type: "uint256",
            },
        ],
        name: "state",
        outputs: [
            {
                internalType: "enum IGovernor.ProposalState",
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
        name: "timelock",
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
        name: "version",
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
        name: "votingDelay",
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
        name: "votingPeriod",
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
