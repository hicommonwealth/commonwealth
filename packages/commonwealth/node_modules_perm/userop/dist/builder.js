"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOperationBuilder = exports.DEFAULT_USER_OP = exports.DEFAULT_PRE_VERIFICATION_GAS = exports.DEFAULT_CALL_GAS_LIMIT = exports.DEFAULT_VERIFICATION_GAS_LIMIT = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
const context_1 = require("./context");
exports.DEFAULT_VERIFICATION_GAS_LIMIT = ethers_1.ethers.BigNumber.from(70000);
exports.DEFAULT_CALL_GAS_LIMIT = ethers_1.ethers.BigNumber.from(35000);
exports.DEFAULT_PRE_VERIFICATION_GAS = ethers_1.ethers.BigNumber.from(21000);
exports.DEFAULT_USER_OP = {
    sender: ethers_1.ethers.constants.AddressZero,
    nonce: ethers_1.ethers.constants.Zero,
    initCode: ethers_1.ethers.utils.hexlify("0x"),
    callData: ethers_1.ethers.utils.hexlify("0x"),
    callGasLimit: exports.DEFAULT_CALL_GAS_LIMIT,
    verificationGasLimit: exports.DEFAULT_VERIFICATION_GAS_LIMIT,
    preVerificationGas: exports.DEFAULT_PRE_VERIFICATION_GAS,
    maxFeePerGas: ethers_1.ethers.constants.Zero,
    maxPriorityFeePerGas: ethers_1.ethers.constants.Zero,
    paymasterAndData: ethers_1.ethers.utils.hexlify("0x"),
    signature: ethers_1.ethers.utils.hexlify("0x"),
};
class UserOperationBuilder {
    constructor() {
        this.defaultOp = Object.assign({}, exports.DEFAULT_USER_OP);
        this.currOp = Object.assign({}, this.defaultOp);
        this.middlewareStack = [];
    }
    resolveFields(op) {
        const obj = {
            sender: op.sender !== undefined
                ? ethers_1.ethers.utils.getAddress(op.sender)
                : undefined,
            nonce: op.nonce !== undefined ? ethers_1.ethers.BigNumber.from(op.nonce) : undefined,
            initCode: op.initCode !== undefined
                ? ethers_1.ethers.utils.hexlify(op.initCode)
                : undefined,
            callData: op.callData !== undefined
                ? ethers_1.ethers.utils.hexlify(op.callData)
                : undefined,
            callGasLimit: op.callGasLimit !== undefined
                ? ethers_1.ethers.BigNumber.from(op.callGasLimit)
                : undefined,
            verificationGasLimit: op.verificationGasLimit !== undefined
                ? ethers_1.ethers.BigNumber.from(op.verificationGasLimit)
                : undefined,
            preVerificationGas: op.preVerificationGas !== undefined
                ? ethers_1.ethers.BigNumber.from(op.preVerificationGas)
                : undefined,
            maxFeePerGas: op.maxFeePerGas !== undefined
                ? ethers_1.ethers.BigNumber.from(op.maxFeePerGas)
                : undefined,
            maxPriorityFeePerGas: op.maxPriorityFeePerGas !== undefined
                ? ethers_1.ethers.BigNumber.from(op.maxPriorityFeePerGas)
                : undefined,
            paymasterAndData: op.paymasterAndData !== undefined
                ? ethers_1.ethers.utils.hexlify(op.paymasterAndData)
                : undefined,
            signature: op.signature !== undefined
                ? ethers_1.ethers.utils.hexlify(op.signature)
                : undefined,
        };
        return Object.keys(obj).reduce((prev, curr) => obj[curr] !== undefined
            ? Object.assign(Object.assign({}, prev), { [curr]: obj[curr] }) : prev, {});
    }
    getSender() {
        return this.currOp.sender;
    }
    getNonce() {
        return this.currOp.nonce;
    }
    getInitCode() {
        return this.currOp.initCode;
    }
    getCallData() {
        return this.currOp.callData;
    }
    getCallGasLimit() {
        return this.currOp.callGasLimit;
    }
    getVerificationGasLimit() {
        return this.currOp.verificationGasLimit;
    }
    getPreVerificationGas() {
        return this.currOp.preVerificationGas;
    }
    getMaxFeePerGas() {
        return this.currOp.maxFeePerGas;
    }
    getMaxPriorityFeePerGas() {
        return this.currOp.maxPriorityFeePerGas;
    }
    getPaymasterAndData() {
        return this.currOp.paymasterAndData;
    }
    getSignature() {
        return this.currOp.signature;
    }
    getOp() {
        return this.currOp;
    }
    setSender(val) {
        this.currOp.sender = ethers_1.ethers.utils.getAddress(val);
        return this;
    }
    setNonce(val) {
        this.currOp.nonce = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setInitCode(val) {
        this.currOp.initCode = ethers_1.ethers.utils.hexlify(val);
        return this;
    }
    setCallData(val) {
        this.currOp.callData = ethers_1.ethers.utils.hexlify(val);
        return this;
    }
    setCallGasLimit(val) {
        this.currOp.callGasLimit = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setVerificationGasLimit(val) {
        this.currOp.verificationGasLimit = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setPreVerificationGas(val) {
        this.currOp.preVerificationGas = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setMaxFeePerGas(val) {
        this.currOp.maxFeePerGas = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setMaxPriorityFeePerGas(val) {
        this.currOp.maxPriorityFeePerGas = ethers_1.ethers.BigNumber.from(val);
        return this;
    }
    setPaymasterAndData(val) {
        this.currOp.paymasterAndData = ethers_1.ethers.utils.hexlify(val);
        return this;
    }
    setSignature(val) {
        this.currOp.signature = ethers_1.ethers.utils.hexlify(val);
        return this;
    }
    setPartial(partialOp) {
        this.currOp = Object.assign(Object.assign({}, this.currOp), this.resolveFields(partialOp));
        return this;
    }
    useDefaults(partialOp) {
        const resolvedOp = this.resolveFields(partialOp);
        this.defaultOp = Object.assign(Object.assign({}, this.defaultOp), resolvedOp);
        this.currOp = Object.assign(Object.assign({}, this.currOp), resolvedOp);
        return this;
    }
    resetDefaults() {
        this.defaultOp = Object.assign({}, exports.DEFAULT_USER_OP);
        return this;
    }
    useMiddleware(fn) {
        this.middlewareStack = [...this.middlewareStack, fn];
        return this;
    }
    resetMiddleware() {
        this.middlewareStack = [];
        return this;
    }
    buildOp(entryPoint, chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ctx = new context_1.UserOperationMiddlewareCtx(this.currOp, entryPoint, chainId);
            for (const fn of this.middlewareStack) {
                yield fn(ctx);
            }
            this.setPartial(ctx.op);
            return (0, utils_1.OpToJSON)(this.currOp);
        });
    }
    resetOp() {
        this.currOp = Object.assign({}, this.defaultOp);
        return this;
    }
}
exports.UserOperationBuilder = UserOperationBuilder;
