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
exports.Enrich = void 0;
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
function Enrich(api, blockNumber, kind, rawData) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (kind) {
            case types_1.EventKind.Approval: {
                const { owner, approved, tokenId } = rawData.args;
                const contractAddress = rawData.address;
                // should not notify sender or recipient
                const excludeAddresses = [owner.toString(), approved.toString()];
                return {
                    blockNumber,
                    excludeAddresses,
                    network: interfaces_1.SupportedNetwork.ERC721,
                    data: {
                        kind,
                        owner,
                        approved,
                        tokenId: tokenId.toString(),
                        contractAddress,
                    },
                };
            }
            case types_1.EventKind.ApprovalForAll: {
                const { owner, operator, approved } = rawData.args;
                const contractAddress = rawData.address;
                // should not notify sender or recipient
                const excludeAddresses = [owner.toString(), operator.toString()];
                return {
                    blockNumber,
                    excludeAddresses,
                    network: interfaces_1.SupportedNetwork.ERC721,
                    data: {
                        kind,
                        owner,
                        operator,
                        approved,
                        contractAddress,
                    },
                };
            }
            case types_1.EventKind.Transfer: {
                const { from, to, tokenId } = rawData.args;
                const contractAddress = rawData.address;
                // no need to explicitly filter transfers of zero tokens, as
                // this would just throw with ERC721.
                // should not notify sender or recipient
                const excludeAddresses = [from.toString(), to.toString()];
                return {
                    blockNumber,
                    excludeAddresses,
                    network: interfaces_1.SupportedNetwork.ERC721,
                    data: {
                        kind,
                        from,
                        to,
                        tokenId: tokenId.toString(),
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