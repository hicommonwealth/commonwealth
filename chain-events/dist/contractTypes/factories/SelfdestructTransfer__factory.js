"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelfdestructTransfer__factory = void 0;
const ethers_1 = require("ethers");
class SelfdestructTransfer__factory extends ethers_1.ContractFactory {
    constructor(signer) {
        super(_abi, _bytecode, signer);
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.SelfdestructTransfer__factory = SelfdestructTransfer__factory;
const _abi = [
    {
        inputs: [
            {
                internalType: "address payable",
                name: "to",
                type: "address",
            },
        ],
        name: "destroyAndTransfer",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
];
const _bytecode = "0x6080604052348015600f57600080fd5b5060888061001e6000396000f3fe608060405260043610601c5760003560e01c8063785e07b3146021575b600080fd5b604460048036036020811015603557600080fd5b50356001600160a01b03166046565b005b806001600160a01b0316fffea264697066735822122039cd6f3f3e3077a165b99440c924173ee7c36146ecd3a327a12955042d1d25e064736f6c634300060c0033";
//# sourceMappingURL=SelfdestructTransfer__factory.js.map