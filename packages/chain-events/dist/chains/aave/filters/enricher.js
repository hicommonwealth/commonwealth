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
            case types_1.EventKind.ProposalCanceled: {
                const { id } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        id: +id,
                    },
                };
            }
            case types_1.EventKind.ProposalCreated: {
                const { id, creator, executor, targets, signatures, calldatas, startBlock, endBlock, strategy, ipfsHash, } = rawData.args;
                // values doesn't appear on the object version, hack around it by accessing the
                // argument array instead
                const values = rawData.args[4];
                return {
                    blockNumber,
                    excludeAddresses: [creator],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        id: +id,
                        proposer: creator,
                        executor,
                        targets,
                        values: values.map((v) => v.toString()),
                        signatures,
                        calldatas,
                        startBlock: +startBlock,
                        endBlock: +endBlock,
                        strategy,
                        ipfsHash,
                    },
                };
            }
            case types_1.EventKind.ProposalExecuted: {
                const { id } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        id: +id,
                    },
                };
            }
            case types_1.EventKind.ProposalQueued: {
                const { id, executionTime } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        id: +id,
                        executionTime: +executionTime,
                    },
                };
            }
            case types_1.EventKind.VoteEmitted: {
                const { voter, id, support, votingPower } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [voter],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        id: +id,
                        voter,
                        support,
                        votingPower: votingPower.toString(),
                    },
                };
            }
            case types_1.EventKind.DelegateChanged: {
                const { delegator, delegatee, delegationType, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [delegator],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        tokenAddress: rawData.address,
                        delegator,
                        delegatee,
                        type: delegationType,
                    },
                };
            }
            case types_1.EventKind.DelegatedPowerChanged: {
                const { user, amount, delegationType } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [user],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        tokenAddress: rawData.address,
                        who: user,
                        amount: amount.toString(),
                        type: delegationType,
                    },
                };
            }
            case types_1.EventKind.Transfer: {
                const { from, to, value } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [from],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        tokenAddress: rawData.address,
                        from,
                        to,
                        amount: value.toString(),
                    },
                };
            }
            case types_1.EventKind.Approval: {
                const { owner, spender, value } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [owner],
                    network: interfaces_1.SupportedNetwork.Aave,
                    data: {
                        kind,
                        tokenAddress: rawData.address,
                        owner,
                        spender,
                        amount: value.toString(),
                    },
                };
            }
            default: {
                throw new Error(`Unknown event kind: ${kind}`);
            }
        }
        return { blockNumber: null, network: interfaces_1.SupportedNetwork.Aave, data: null };
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map