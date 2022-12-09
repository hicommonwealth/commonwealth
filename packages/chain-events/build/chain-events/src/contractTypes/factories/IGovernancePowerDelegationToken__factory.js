"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IGovernancePowerDelegationToken__factory = void 0;
const ethers_1 = require("ethers");
class IGovernancePowerDelegationToken__factory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.IGovernancePowerDelegationToken__factory = IGovernancePowerDelegationToken__factory;
const _abi = [
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
];
