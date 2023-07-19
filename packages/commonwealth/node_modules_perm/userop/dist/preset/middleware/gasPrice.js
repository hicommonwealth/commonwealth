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
exports.getGasPrice = void 0;
const ethers_1 = require("ethers");
const eip1559GasPrice = (provider) => __awaiter(void 0, void 0, void 0, function* () {
    const [fee, block] = yield Promise.all([
        provider.send("eth_maxPriorityFeePerGas", []),
        provider.getBlock("latest"),
    ]);
    const tip = ethers_1.ethers.BigNumber.from(fee);
    const buffer = tip.div(100).mul(13);
    const maxPriorityFeePerGas = tip.add(buffer);
    const maxFeePerGas = block.baseFeePerGas
        ? block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas)
        : maxPriorityFeePerGas;
    return { maxFeePerGas, maxPriorityFeePerGas };
});
const legacyGasPrice = (provider) => __awaiter(void 0, void 0, void 0, function* () {
    const gas = yield provider.getGasPrice();
    return { maxFeePerGas: gas, maxPriorityFeePerGas: gas };
});
const getGasPrice = (provider) => (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    let eip1559Error;
    try {
        const { maxFeePerGas, maxPriorityFeePerGas } = yield eip1559GasPrice(provider);
        ctx.op.maxFeePerGas = maxFeePerGas;
        ctx.op.maxPriorityFeePerGas = maxPriorityFeePerGas;
        return;
    }
    catch (error) {
        eip1559Error = error;
        console.warn("getGas: eth_maxPriorityFeePerGas failed, falling back to legacy gas price.");
    }
    try {
        const { maxFeePerGas, maxPriorityFeePerGas } = yield legacyGasPrice(provider);
        ctx.op.maxFeePerGas = maxFeePerGas;
        ctx.op.maxPriorityFeePerGas = maxPriorityFeePerGas;
        return;
    }
    catch (error) {
        throw new Error(`${eip1559Error}, ${error}`);
    }
});
exports.getGasPrice = getGasPrice;
