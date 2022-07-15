"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICuratedProjectFactory__factory = void 0;
const ethers_1 = require("ethers");
class ICuratedProjectFactory__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.ICuratedProjectFactory__factory = ICuratedProjectFactory__factory;
const _abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "projectIndex",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "address",
                name: "projectAddress",
                type: "address",
            },
        ],
        name: "ProjectCreated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "oldAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "newAddr",
                type: "address",
            },
        ],
        name: "ProjectImplChange",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint8",
                name: "oldFee",
                type: "uint8",
            },
            {
                indexed: false,
                internalType: "uint8",
                name: "newFee",
                type: "uint8",
            },
        ],
        name: "ProtocolFeeChange",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "oldAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "newAddr",
                type: "address",
            },
        ],
        name: "ProtocolFeeToChange",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "address",
                name: "oldAddr",
                type: "address",
            },
            {
                indexed: false,
                internalType: "address",
                name: "newAddr",
                type: "address",
            },
        ],
        name: "ProtocolTokenImplChange",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address[]",
                name: "_tokens",
                type: "address[]",
            },
        ],
        name: "addAcceptedTokens",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "_name",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "_ipfsHash",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "_url",
                type: "bytes32",
            },
            {
                internalType: "address",
                name: "_beneficiary",
                type: "address",
            },
            {
                internalType: "address",
                name: "_acceptedToken",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_threshold",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_deadline",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "_curatorFee",
                type: "uint256",
            },
        ],
        name: "createProject",
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
                name: "token",
                type: "address",
            },
        ],
        name: "isAcceptedToken",
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
        name: "numProjects",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
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
        name: "projectImp",
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
                internalType: "uint32",
                name: "projectIndex",
                type: "uint32",
            },
        ],
        name: "projects",
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
        name: "protocolData",
        outputs: [
            {
                components: [
                    {
                        internalType: "uint8",
                        name: "fee",
                        type: "uint8",
                    },
                    {
                        internalType: "address",
                        name: "feeTo",
                        type: "address",
                    },
                ],
                internalType: "struct DataTypes.ProtocolData",
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
                name: "_cmnProjTokenImpl",
                type: "address",
            },
        ],
        name: "setCmnProjTokenImpl",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_feeTo",
                type: "address",
            },
        ],
        name: "setFeeTo",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_projectImpl",
                type: "address",
            },
        ],
        name: "setProjectImpl",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint8",
                name: "_protocolFee",
                type: "uint8",
            },
        ],
        name: "setProtocolFee",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
//# sourceMappingURL=ICuratedProjectFactory__factory.js.map