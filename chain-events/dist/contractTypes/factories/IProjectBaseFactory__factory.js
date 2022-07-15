"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IProjectBaseFactory__factory = void 0;
const ethers_1 = require("ethers");
class IProjectBaseFactory__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.IProjectBaseFactory__factory = IProjectBaseFactory__factory;
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
//# sourceMappingURL=IProjectBaseFactory__factory.js.map