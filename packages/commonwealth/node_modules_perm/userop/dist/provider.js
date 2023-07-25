"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundlerJsonRpcProvider = void 0;
const ethers_1 = require("ethers");
class BundlerJsonRpcProvider extends ethers_1.ethers.providers.JsonRpcProvider {
    constructor() {
        super(...arguments);
        this.bundlerMethods = new Set([
            "eth_sendUserOperation",
            "eth_estimateUserOperationGas",
            "eth_getUserOperationByHash",
            "eth_getUserOperationReceipt",
            "eth_supportedEntryPoints",
        ]);
    }
    setBundlerRpc(bundlerRpc) {
        if (bundlerRpc) {
            this.bundlerRpc = new ethers_1.ethers.providers.JsonRpcProvider(bundlerRpc);
        }
        return this;
    }
    send(method, params) {
        if (this.bundlerRpc && this.bundlerMethods.has(method)) {
            return this.bundlerRpc.send(method, params);
        }
        return super.send(method, params);
    }
}
exports.BundlerJsonRpcProvider = BundlerJsonRpcProvider;
