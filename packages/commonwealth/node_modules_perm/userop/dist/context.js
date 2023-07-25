"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOperationMiddlewareCtx = void 0;
const ethers_1 = require("ethers");
class UserOperationMiddlewareCtx {
    constructor(op, entryPoint, chainId) {
        this.op = Object.assign({}, op);
        this.entryPoint = ethers_1.ethers.utils.getAddress(entryPoint);
        this.chainId = ethers_1.ethers.BigNumber.from(chainId);
    }
    getUserOpHash() {
        const packed = ethers_1.ethers.utils.defaultAbiCoder.encode([
            "address",
            "uint256",
            "bytes32",
            "bytes32",
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "uint256",
            "bytes32",
        ], [
            this.op.sender,
            this.op.nonce,
            ethers_1.ethers.utils.keccak256(this.op.initCode),
            ethers_1.ethers.utils.keccak256(this.op.callData),
            this.op.callGasLimit,
            this.op.verificationGasLimit,
            this.op.preVerificationGas,
            this.op.maxFeePerGas,
            this.op.maxPriorityFeePerGas,
            ethers_1.ethers.utils.keccak256(this.op.paymasterAndData),
        ]);
        const enc = ethers_1.ethers.utils.defaultAbiCoder.encode(["bytes32", "address", "uint256"], [ethers_1.ethers.utils.keccak256(packed), this.entryPoint, this.chainId]);
        return ethers_1.ethers.utils.keccak256(enc);
    }
}
exports.UserOperationMiddlewareCtx = UserOperationMiddlewareCtx;
