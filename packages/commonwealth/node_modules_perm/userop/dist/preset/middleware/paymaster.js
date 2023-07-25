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
exports.verifyingPaymaster = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("../../utils");
// Assumes the paymaster interface in https://hackmd.io/@stackup/H1oIvV-qi
const verifyingPaymaster = (paymasterRpc, context) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.op.verificationGasLimit = ethers_1.ethers.BigNumber.from(ctx.op.verificationGasLimit).mul(3);
    const provider = new ethers_1.ethers.providers.JsonRpcProvider(paymasterRpc);
    const pm = (yield provider.send("pm_sponsorUserOperation", [
        (0, utils_1.OpToJSON)(ctx.op),
        ctx.entryPoint,
        context,
    ]));
    ctx.op.paymasterAndData = pm.paymasterAndData;
    ctx.op.preVerificationGas = pm.preVerificationGas;
    ctx.op.verificationGasLimit = pm.verificationGasLimit;
    ctx.op.callGasLimit = pm.callGasLimit;
});
exports.verifyingPaymaster = verifyingPaymaster;
