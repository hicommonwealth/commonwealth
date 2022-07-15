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
const web3_utils_1 = require("web3-utils");
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
// these functions unwrap the uint type received from chain,
// which is an object like { _hex: <value> }, into a string/number
function hexToString({ _hex: n }) {
    return web3_utils_1.hexToNumberString(n);
}
function hexToNumber({ _hex: n }) {
    return web3_utils_1.hexToNumber(n);
}
/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
function Enrich(version, api, blockNumber, kind, rawData) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (kind) {
            case types_1.EventKind.SubmitProposal: {
                const { proposalIndex, delegateKey, memberAddress, applicant, tokenTribute, sharesRequested, } = rawData.args;
                // TODO: pull these out into class, perhaps
                const proposal = yield api.proposalQueue(proposalIndex);
                const startingPeriod = +proposal.startingPeriod;
                const { details } = proposal;
                const periodDuration = +(yield api.periodDuration());
                const summoningTime = +(yield api.summoningTime());
                return {
                    blockNumber,
                    excludeAddresses: [memberAddress],
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        proposalIndex: hexToNumber(proposalIndex),
                        delegateKey,
                        member: memberAddress,
                        applicant,
                        tokenTribute: hexToString(tokenTribute),
                        sharesRequested: hexToString(sharesRequested),
                        details,
                        startTime: summoningTime + startingPeriod * periodDuration,
                    },
                };
            }
            case types_1.EventKind.SubmitVote: {
                const { proposalIndex, delegateKey, memberAddress, uintVote, } = rawData.args;
                const member = yield api.members(memberAddress);
                return {
                    blockNumber,
                    excludeAddresses: [memberAddress],
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        proposalIndex: hexToNumber(proposalIndex),
                        delegateKey,
                        member: memberAddress,
                        vote: uintVote,
                        shares: member.shares.toString(),
                        highestIndexYesVote: +member.highestIndexYesVote,
                    },
                };
            }
            case types_1.EventKind.ProcessProposal: {
                const { proposalIndex, applicant, memberAddress, tokenTribute, sharesRequested, didPass, } = rawData.args;
                const proposal = yield api.proposalQueue(proposalIndex);
                return {
                    blockNumber,
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        proposalIndex: hexToNumber(proposalIndex),
                        applicant,
                        member: memberAddress,
                        tokenTribute: hexToString(tokenTribute),
                        sharesRequested: hexToString(sharesRequested),
                        didPass,
                        yesVotes: proposal.yesVotes.toString(),
                        noVotes: proposal.noVotes.toString(),
                    },
                };
            }
            case types_1.EventKind.Ragequit: {
                const { memberAddress, sharesToBurn } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [memberAddress],
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        member: memberAddress,
                        sharesToBurn: hexToString(sharesToBurn),
                    },
                };
            }
            case types_1.EventKind.Abort: {
                const { proposalIndex, applicantAddress } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [applicantAddress],
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        proposalIndex: hexToNumber(proposalIndex),
                        applicant: applicantAddress,
                    },
                };
            }
            case types_1.EventKind.UpdateDelegateKey: {
                const { memberAddress, newDelegateKey } = rawData.args;
                return {
                    blockNumber,
                    // TODO: we only alert the new delegate that the key was changed
                    //   ...is this correct?
                    includeAddresses: [newDelegateKey],
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        member: memberAddress,
                        newDelegateKey,
                    },
                };
            }
            case types_1.EventKind.SummonComplete: {
                const { summoner, shares } = rawData.args;
                return {
                    blockNumber,
                    network: interfaces_1.SupportedNetwork.Moloch,
                    data: {
                        kind,
                        summoner,
                        shares: hexToString(shares),
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