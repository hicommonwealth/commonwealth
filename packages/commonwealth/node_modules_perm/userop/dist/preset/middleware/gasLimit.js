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
exports.estimateUserOperationGas = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("../../utils");
const estimateCreationGas = (provider, initCode) => __awaiter(void 0, void 0, void 0, function* () {
    const initCodeHex = ethers_1.ethers.utils.hexlify(initCode);
    const factory = initCodeHex.substring(0, 42);
    const callData = "0x" + initCodeHex.substring(42);
    return yield provider.estimateGas({
        to: factory,
        data: callData,
    });
});
const estimateUserOperationGas = (provider) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (ethers_1.ethers.BigNumber.from(ctx.op.nonce).isZero()) {
        ctx.op.verificationGasLimit = ethers_1.ethers.BigNumber.from(ctx.op.verificationGasLimit).add(yield estimateCreationGas(provider, ctx.op.initCode));
    }
    const est = (yield provider.send("eth_estimateUserOperationGas", [
        (0, utils_1.OpToJSON)(ctx.op),
        ctx.entryPoint,
    ]));
    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit = est.verificationGas;
    ctx.op.callGasLimit = est.callGasLimit;
});
exports.estimateUserOperationGas = estimateUserOperationGas;
