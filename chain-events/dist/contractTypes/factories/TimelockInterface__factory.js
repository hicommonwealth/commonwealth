"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelockInterface__factory = void 0;
const ethers_1 = require("ethers");
class TimelockInterface__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.TimelockInterface__factory = TimelockInterface__factory;
const _abi = [
    {
        constant: true,
        inputs: [],
        name: "GRACE_PERIOD",
        outputs: [
            {
                internalType: "uint256",
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
        inputs: [],
        name: "acceptAdmin",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: false,
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
                internalType: "uint256",
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
                name: "eta",
                type: "uint256",
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
        payable: true,
        stateMutability: "payable",
        type: "function",
    },
    {
        constant: false,
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
                name: "eta",
                type: "uint256",
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
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                internalType: "bytes32",
                name: "hash",
                type: "bytes32",
            },
        ],
        name: "queuedTransactions",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
];
//# sourceMappingURL=TimelockInterface__factory.js.map