"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompInterface__factory = void 0;
const ethers_1 = require("ethers");
class CompInterface__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.CompInterface__factory = CompInterface__factory;
const _abi = [
    {
        constant: true,
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
        name: "getPriorVotes",
        outputs: [
            {
                internalType: "uint96",
                name: "",
                type: "uint96",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
];
