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
exports.Client = void 0;
const ethers_1 = require("ethers");
const typechain_1 = require("./typechain");
const utils_1 = require("./utils");
const context_1 = require("./context");
const constants_1 = require("./constants");
const provider_1 = require("./provider");
class Client {
    constructor(rpcUrl, opts) {
        this.provider = new provider_1.BundlerJsonRpcProvider(rpcUrl).setBundlerRpc(opts === null || opts === void 0 ? void 0 : opts.overrideBundlerRpc);
        this.entryPoint = typechain_1.EntryPoint__factory.connect((opts === null || opts === void 0 ? void 0 : opts.entryPoint) || constants_1.ERC4337.EntryPoint, this.provider);
        this.chainId = ethers_1.ethers.BigNumber.from(1);
        this.waitTimeoutMs = 30000;
        this.waitIntervalMs = 5000;
    }
    static init(rpcUrl, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new Client(rpcUrl, opts);
            instance.chainId = yield instance.provider
                .getNetwork()
                .then((network) => ethers_1.ethers.BigNumber.from(network.chainId));
            return instance;
        });
    }
    buildUserOperation(builder) {
        return __awaiter(this, void 0, void 0, function* () {
            return builder.buildOp(this.entryPoint.address, this.chainId);
        });
    }
    sendUserOperation(builder, opts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const dryRun = Boolean(opts === null || opts === void 0 ? void 0 : opts.dryRun);
            const op = yield this.buildUserOperation(builder);
            (_a = opts === null || opts === void 0 ? void 0 : opts.onBuild) === null || _a === void 0 ? void 0 : _a.call(opts, op);
            const userOpHash = dryRun
                ? new context_1.UserOperationMiddlewareCtx(op, this.entryPoint.address, this.chainId).getUserOpHash()
                : (yield this.provider.send("eth_sendUserOperation", [
                    (0, utils_1.OpToJSON)(op),
                    this.entryPoint.address,
                ]));
            builder.resetOp();
            return {
                userOpHash,
                wait: () => __awaiter(this, void 0, void 0, function* () {
                    if (dryRun) {
                        return null;
                    }
                    const end = Date.now() + this.waitTimeoutMs;
                    const block = yield this.provider.getBlock("latest");
                    while (Date.now() < end) {
                        const events = yield this.entryPoint.queryFilter(this.entryPoint.filters.UserOperationEvent(userOpHash), Math.max(0, block.number - 100));
                        if (events.length > 0) {
                            return events[0];
                        }
                        yield new Promise((resolve) => setTimeout(resolve, this.waitIntervalMs));
                    }
                    return null;
                }),
            };
        });
    }
}
exports.Client = Client;
