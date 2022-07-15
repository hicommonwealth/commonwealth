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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrich = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
function Enrich(api, blockNumber, kind, rawData, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { totalSupply, tokenName } = api.tokens.find(({ contract }) => contract.address.toLowerCase() === rawData.address.toLowerCase());
        switch (kind) {
            case types_1.EventKind.Approval: {
                const { owner, spender, value: valueBigNumber, } = rawData.args;
                const contractAddress = rawData.address;
                const value = new bn_js_1.default(valueBigNumber.toString());
                // only emit to everyone if approval value is 0 or above the configuration threshold
                const shouldEmitToAll = !config.balanceTransferThresholdPermill ||
                    value
                        .muln(1000000)
                        .divn(config.balanceTransferThresholdPermill)
                        .gte(totalSupply);
                // skip this event if the approval value isn't above the threshold
                if (!shouldEmitToAll)
                    return null;
                // should not notify sender or recipient
                const excludeAddresses = [owner.toString(), spender.toString()];
                return {
                    blockNumber,
                    excludeAddresses,
                    network: interfaces_1.SupportedNetwork.ERC20,
                    data: {
                        kind,
                        owner,
                        spender,
                        value: value.toString(),
                        contractAddress,
                    },
                };
            }
            case types_1.EventKind.Transfer: {
                const { from, to, value: valueBigNumber } = rawData.args;
                const contractAddress = rawData.address;
                const value = new bn_js_1.default(valueBigNumber.toString());
                // only emit to everyone if transfer is 0 or above the configuration threshold
                const shouldEmitToAll = !config.balanceTransferThresholdPermill ||
                    value
                        .muln(1000000)
                        .divn(config.balanceTransferThresholdPermill)
                        .gte(totalSupply);
                // skip this event if the transfer value isn't above the threshold
                if (!shouldEmitToAll)
                    return null;
                // should not notify sender or recipient
                const excludeAddresses = [from.toString(), to.toString()];
                return {
                    blockNumber,
                    excludeAddresses,
                    network: interfaces_1.SupportedNetwork.ERC20,
                    data: {
                        kind,
                        from,
                        to,
                        value: value.toString(),
                        contractAddress,
                    },
                };
            }
            default: {
                throw new Error(`Unknown event kind: ${kind}`);
            }
        }
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map