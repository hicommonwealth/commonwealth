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
const types_1 = require("@polkadot/types");
const util_1 = require("@polkadot/util");
const lodash_1 = require("lodash");
const interfaces_1 = require("../../../interfaces");
const types_2 = require("../types");
const currentPoint_1 = require("../utils/currentPoint");
/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
function Enrich(api, blockNumber, kind, rawData, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const extractEventData = (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            switch (kind) {
                case types_2.EventKind.BalanceTransfer: {
                    const [sender, dest, value] = event.data;
                    // TODO: we may want to consider passing a hard threshold rather than recomputing it every
                    //   time, in order to save on queries for chains with a large amount of transfers.
                    const totalIssuance = yield api.query.balances.totalIssuance();
                    // only emit to everyone if transfer is 0 or above the configuration threshold
                    const shouldEmitToAll = !config.balanceTransferThresholdPermill ||
                        value
                            .muln(1000000)
                            .divn(config.balanceTransferThresholdPermill)
                            .gte(totalIssuance);
                    // skip this event if the transfer value isn't above the threshold
                    if (!shouldEmitToAll)
                        return null;
                    // should not notify sender or recipient
                    const excludeAddresses = [sender.toString(), dest.toString()];
                    return {
                        excludeAddresses,
                        data: {
                            kind,
                            sender: sender.toString(),
                            dest: dest.toString(),
                            value: value.toString(),
                        },
                    };
                }
                /**
                 * ImOnline Events
                 */
                case types_2.EventKind.HeartbeatReceived: {
                    const [authorityId] = event.data;
                    return {
                        data: {
                            kind,
                            authorityId: authorityId.toString(),
                        },
                    };
                }
                case types_2.EventKind.SomeOffline: {
                    const hash = yield api.rpc.chain.getBlockHash(blockNumber);
                    const sessionIndex = yield api.query.session.currentIndex.at(hash);
                    const [validators] = event.data;
                    return {
                        data: {
                            kind,
                            sessionIndex: +sessionIndex - 1,
                            validators: validators === null || validators === void 0 ? void 0 : validators.map((v) => v.toString()),
                        },
                    };
                }
                case types_2.EventKind.AllGood: {
                    const hash = yield api.rpc.chain.getBlockHash(blockNumber);
                    const sessionIndex = yield api.query.session.currentIndex.at(hash);
                    const validators = yield api.query.session.validators.at(hash);
                    return {
                        data: {
                            kind,
                            sessionIndex: +sessionIndex - 1,
                            validators: validators === null || validators === void 0 ? void 0 : validators.map((v) => v.toString()),
                        },
                    };
                }
                /**
                 * Offences Events
                 */
                case types_2.EventKind.Offence: {
                    const [offenceKind, opaqueTimeSlot, applied,] = event.data;
                    const reportIds = yield api.query.offences.concurrentReportsIndex(offenceKind, opaqueTimeSlot);
                    const offenceDetails = yield api.query.offences.reports.multi(reportIds);
                    const allOffenders = offenceDetails.map((offence) => {
                        return offence.isSome ? offence.unwrap().offender[0] : null;
                    });
                    const offenders = lodash_1.filter(allOffenders, null);
                    return {
                        data: {
                            kind,
                            offenceKind: offenceKind.toString(),
                            opaqueTimeSlot: opaqueTimeSlot.toString(),
                            applied: applied === null || applied === void 0 ? void 0 : applied.isTrue,
                            offenders: offenders.map((offender) => offender.toString()),
                        },
                    };
                }
                /**
                 * Session Events
                 */
                case types_2.EventKind.NewSession: {
                    const hash = yield api.rpc.chain.getBlockHash(blockNumber);
                    const sessionIndex = yield api.query.session.currentIndex.at(hash);
                    const validators = yield api.query.session.validators.at(hash);
                    // get era of current block
                    const rawCurrentEra = yield api.query.staking.currentEra.at(hash);
                    const currentEra = rawCurrentEra instanceof types_1.Option
                        ? rawCurrentEra.unwrap()
                        : rawCurrentEra;
                    // get the nextElected Validators
                    const keys = api.query.staking.erasStakers
                        ? // for version >= 38
                            yield api.query.staking.erasStakers.keysAt(hash, currentEra)
                        : // for version = 31
                            yield api.query.staking.stakers.keysAt(hash);
                    const nextElected = (keys === null || keys === void 0 ? void 0 : keys.length) > 0
                        ? keys.map((key) => key.args[key.args.length - 1].toString())
                        : validators.map((v) => v.toString());
                    // get current stashes
                    const stashes = yield api.query.staking.validators.keysAt(hash);
                    // find waiting validators
                    const stashesStr = stashes
                        .filter((v) => v.args.length > 0)
                        .map((v) => v.args[0].toString());
                    const waiting = stashesStr.filter((v) => !nextElected.includes(v));
                    // get validators current era reward points
                    const validatorEraPoints = yield currentPoint_1.currentPoints(api, currentEra, hash, validators);
                    // populate per-validator information
                    const validatorInfo = {};
                    for (const validator of validators) {
                        const key = validator.toString();
                        // get commissions
                        const preference = api.query.staking.erasValidatorPrefs
                            ? // for version >= 38
                                yield api.query.staking.erasValidatorPrefs.at(hash, currentEra, key)
                            : // for version == 31
                                yield api.query.staking.validators.at(hash, key);
                        const commissionPer = (+preference.commission || 0) / 10000000;
                        const rewardDestination = yield api.query.staking.payee.at(hash, key);
                        const controllerId = yield api.query.staking.bonded.at(hash, key);
                        validatorInfo[key] = {
                            commissionPer,
                            controllerId: controllerId.isSome
                                ? controllerId.unwrap().toString()
                                : key,
                            rewardDestination,
                            eraPoints: (_a = validatorEraPoints[key]) !== null && _a !== void 0 ? _a : 0,
                        };
                    }
                    // populate exposures
                    const activeExposures = {};
                    if (validators && currentEra) {
                        // if currentEra isn't empty
                        yield Promise.all(validators.map((validator) => __awaiter(this, void 0, void 0, function* () {
                            const tmpExposure = api.query.staking.erasStakers
                                ? yield api.query.staking.erasStakers.at(hash, currentEra, validator)
                                : yield api.query.staking.stakers.at(hash, validator);
                            activeExposures[validator.toString()] = {
                                own: +tmpExposure.own,
                                total: +tmpExposure.total,
                                others: tmpExposure.others.map((exp) => ({
                                    who: exp.who.toString(),
                                    value: exp.value.toString(),
                                })),
                            };
                        })));
                    }
                    return {
                        data: {
                            kind,
                            activeExposures,
                            active: validators === null || validators === void 0 ? void 0 : validators.map((v) => v.toString()),
                            waiting,
                            sessionIndex: +sessionIndex,
                            currentEra: +currentEra,
                            validatorInfo,
                        },
                    };
                }
                /**
                 * Staking Events
                 */
                case types_2.EventKind.Reward: {
                    if (event.data.typeDef[0].type === 'Balance') {
                        // edgeware/old event
                        const [amount] = event.data;
                        return {
                            data: {
                                kind,
                                amount: amount.toString(),
                            },
                        };
                    }
                    // kusama/new event
                    const [validator, amount] = event.data;
                    return {
                        includeAddresses: [validator.toString()],
                        data: {
                            kind,
                            validator: validator.toString(),
                            amount: amount.toString(),
                        },
                    };
                }
                case types_2.EventKind.Slash: {
                    const [validator, amount] = event.data;
                    return {
                        includeAddresses: [validator.toString()],
                        data: {
                            kind,
                            validator: validator.toString(),
                            amount: amount.toString(),
                        },
                    };
                }
                case types_2.EventKind.Bonded:
                case types_2.EventKind.Unbonded: {
                    const hash = yield api.rpc.chain.getBlockHash(blockNumber);
                    const [stash, amount] = event.data;
                    const controllerOpt = yield api.query.staking.bonded.at(hash, stash);
                    if (!controllerOpt.isSome) {
                        throw new Error(`could not fetch staking controller for ${stash.toString()}`);
                    }
                    return {
                        includeAddresses: [stash.toString()],
                        data: {
                            kind,
                            stash: stash.toString(),
                            amount: amount.toString(),
                            controller: controllerOpt.unwrap().toString(),
                        },
                    };
                }
                case types_2.EventKind.StakingElection: {
                    const era = yield api.query.staking.activeEra();
                    const validators = yield api.derive.staking.validators();
                    return {
                        data: {
                            kind,
                            era: +era,
                            validators: (_b = validators.validators) === null || _b === void 0 ? void 0 : _b.map((v) => v.toString()),
                        },
                    };
                }
                /**
                 * Democracy Events
                 */
                case types_2.EventKind.VoteDelegated: {
                    const [who, target] = event.data;
                    return {
                        includeAddresses: [target.toString()],
                        data: {
                            kind,
                            who: who.toString(),
                            target: target.toString(),
                        },
                    };
                }
                case types_2.EventKind.DemocracyProposed: {
                    const [proposalIndex, deposit] = event.data;
                    const props = yield api.query.democracy.publicProps();
                    const prop = props.find((p) => p.length > 0 && +p[0] === +proposalIndex);
                    if (!prop) {
                        throw new Error(`could not fetch info for proposal ${+proposalIndex}`);
                    }
                    const [, hash, proposer] = prop;
                    return {
                        excludeAddresses: [proposer.toString()],
                        data: {
                            kind,
                            proposalIndex: +proposalIndex,
                            proposalHash: hash.toString(),
                            deposit: deposit.toString(),
                            proposer: proposer.toString(),
                        },
                    };
                }
                case types_2.EventKind.DemocracyTabled: {
                    const [proposalIndex] = event.data;
                    return {
                        data: {
                            kind,
                            proposalIndex: +proposalIndex,
                        },
                    };
                }
                case types_2.EventKind.DemocracyStarted: {
                    const [referendumIndex, voteThreshold] = event.data;
                    const infoOpt = yield api.query.democracy.referendumInfoOf(referendumIndex);
                    if (!infoOpt.isSome) {
                        throw new Error(`could not find info for referendum ${+referendumIndex}`);
                    }
                    if (infoOpt.unwrap().isOngoing) {
                        // kusama
                        const info = infoOpt.unwrap();
                        if (!info.isOngoing) {
                            throw new Error(`kusama referendum ${+referendumIndex} not in ongoing state`);
                        }
                        return {
                            data: {
                                kind,
                                referendumIndex: +referendumIndex,
                                proposalHash: info.asOngoing.proposalHash.toString(),
                                voteThreshold: voteThreshold.toString(),
                                endBlock: +info.asOngoing.end,
                            },
                        };
                    }
                    // edgeware
                    const info = infoOpt.unwrap();
                    return {
                        data: {
                            kind,
                            referendumIndex: +referendumIndex,
                            proposalHash: info.proposalHash.toString(),
                            voteThreshold: voteThreshold.toString(),
                            endBlock: +info.end,
                        },
                    };
                }
                case types_2.EventKind.DemocracyPassed: {
                    const [referendumIndex] = event.data;
                    // dispatch queue -- if not present, it was already executed
                    const dispatchQueue = yield api.derive.democracy.dispatchQueue();
                    const dispatchInfo = dispatchQueue.find(({ index }) => +index === +referendumIndex);
                    return {
                        data: {
                            kind,
                            referendumIndex: +referendumIndex,
                            dispatchBlock: dispatchInfo ? +dispatchInfo.at : null,
                        },
                    };
                }
                case types_2.EventKind.DemocracyNotPassed:
                case types_2.EventKind.DemocracyCancelled: {
                    const [referendumIndex] = event.data;
                    return {
                        data: {
                            kind,
                            referendumIndex: +referendumIndex,
                        },
                    };
                }
                case types_2.EventKind.DemocracyExecuted: {
                    const [referendumIndex, executionOk] = event.data;
                    return {
                        data: {
                            kind,
                            referendumIndex: +referendumIndex,
                            executionOk: executionOk.isTrue,
                        },
                    };
                }
                /**
                 * Preimage Events
                 */
                case types_2.EventKind.PreimageNoted: {
                    const [hash, noter] = event.data;
                    const image = yield api.derive.democracy.preimage(hash);
                    if (!image || !image.proposal) {
                        throw new Error(`could not find info for preimage ${hash.toString()}`);
                    }
                    return {
                        excludeAddresses: [noter.toString()],
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            noter: noter.toString(),
                            preimage: {
                                method: image.proposal.method,
                                section: image.proposal.section,
                                args: image.proposal.args.map((a) => a.toString()),
                            },
                        },
                    };
                }
                case types_2.EventKind.PreimageUsed: {
                    const [hash, noter] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            noter: noter.toString(),
                        },
                    };
                }
                case types_2.EventKind.PreimageInvalid:
                case types_2.EventKind.PreimageMissing: {
                    const [hash, referendumIndex] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            referendumIndex: +referendumIndex,
                        },
                    };
                }
                case types_2.EventKind.PreimageReaped: {
                    const [hash, noter, , reaper] = event.data;
                    return {
                        excludeAddresses: [reaper.toString()],
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            noter: noter.toString(),
                            reaper: reaper.toString(),
                        },
                    };
                }
                /**
                 * Tip Events
                 */
                case types_2.EventKind.NewTip: {
                    const [hash] = event.data;
                    const tip = yield api.query.tips.tips(hash);
                    if (!tip.isSome) {
                        throw new Error(`Could not find tip: ${hash.toString()}`);
                    }
                    const { reason: reasonHash, who, finder, deposit, findersFee, } = tip.unwrap();
                    const reasonOpt = yield api.query.tips.reasons(reasonHash);
                    if (!reasonOpt.isSome) {
                        throw new Error(`Could not find reason for tip: ${reasonHash.toString()}`);
                    }
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            // TODO: verify this reason string unmarshals correctly
                            reason: util_1.hexToString(reasonOpt.unwrap().toString()),
                            who: who.toString(),
                            finder: finder.toString(),
                            deposit: deposit.toString(),
                            findersFee: findersFee.valueOf(),
                        },
                    };
                }
                case types_2.EventKind.TipClosing: {
                    const [hash] = event.data;
                    const tip = yield api.query.tips.tips(hash);
                    if (!tip.isSome) {
                        throw new Error(`Could not find tip: ${hash.toString()}`);
                    }
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            closing: +tip.unwrap().closes.unwrap(),
                        },
                    };
                }
                case types_2.EventKind.TipClosed: {
                    const [hash, accountId, balance] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            who: accountId.toString(),
                            payout: balance.toString(),
                        },
                    };
                }
                case types_2.EventKind.TipRetracted: {
                    const [hash] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                        },
                    };
                }
                case types_2.EventKind.TipSlashed: {
                    const [hash, accountId, balance] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            finder: accountId.toString(),
                            deposit: balance.toString(),
                        },
                    };
                }
                /**
                 * Treasury Events
                 */
                case types_2.EventKind.TreasuryProposed: {
                    const [proposalIndex] = event.data;
                    const proposalOpt = yield api.query.treasury.proposals(proposalIndex);
                    if (!proposalOpt.isSome) {
                        throw new Error(`could not fetch treasury proposal index ${+proposalIndex}`);
                    }
                    const proposal = proposalOpt.unwrap();
                    return {
                        excludeAddresses: [proposal.proposer.toString()],
                        data: {
                            kind,
                            proposalIndex: +proposalIndex,
                            proposer: proposal.proposer.toString(),
                            value: proposal.value.toString(),
                            beneficiary: proposal.beneficiary.toString(),
                            bond: proposal.bond.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryAwarded: {
                    const [proposalIndex, amount, beneficiary,] = event.data;
                    return {
                        data: {
                            kind,
                            proposalIndex: +proposalIndex,
                            value: amount.toString(),
                            beneficiary: beneficiary.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryRejected: {
                    const [proposalIndex] = event.data;
                    return {
                        data: {
                            kind,
                            proposalIndex: +proposalIndex,
                        },
                    };
                }
                /**
                 * Bounty Events
                 */
                case types_2.EventKind.TreasuryBountyProposed: {
                    const [bountyIndex] = event.data;
                    const bounties = yield api.derive.bounties.bounties();
                    if (!bounties) {
                        throw new Error(`could not fetch bounties`);
                    }
                    const bounty = bounties.find((b) => +b.index === +bountyIndex);
                    if (!bounty) {
                        throw new Error(`could not find bounty`);
                    }
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                            proposer: bounty.bounty.proposer.toString(),
                            value: bounty.bounty.value.toString(),
                            fee: bounty.bounty.fee.toString(),
                            curatorDeposit: bounty.bounty.curatorDeposit.toString(),
                            bond: bounty.bounty.bond.toString(),
                            description: bounty.description,
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyAwarded: {
                    const [bountyIndex, beneficiary] = event.data;
                    const bounties = yield api.derive.bounties.bounties();
                    if (!bounties) {
                        throw new Error(`could not fetch bounties`);
                    }
                    const bounty = bounties.find((b) => +b.index === +bountyIndex);
                    if (!bounty) {
                        throw new Error(`could not find bounty`);
                    }
                    if (!bounty.bounty.status.isPendingPayout) {
                        throw new Error(`invalid bounty status`);
                    }
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                            beneficiary: beneficiary.toString(),
                            curator: bounty.bounty.status.asPendingPayout.curator.toString(),
                            unlockAt: +bounty.bounty.status.asPendingPayout.unlockAt,
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyRejected: {
                    const [bountyIndex, bond] = event.data;
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                            bond: bond.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyClaimed: {
                    const [bountyIndex, payout, beneficiary] = event.data;
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                            payout: payout.toString(),
                            beneficiary: beneficiary === null || beneficiary === void 0 ? void 0 : beneficiary.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyCanceled: {
                    const [bountyIndex] = event.data;
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyBecameActive: {
                    const [bountyIndex] = event.data;
                    const bounties = yield api.derive.bounties.bounties();
                    if (!bounties) {
                        throw new Error(`could not fetch bounties`);
                    }
                    const bounty = bounties.find((b) => +b.index === +bountyIndex);
                    if (!bounty) {
                        throw new Error(`could not find bounty`);
                    }
                    if (!bounty.bounty.status.isActive) {
                        throw new Error(`invalid bounty status`);
                    }
                    return {
                        data: {
                            kind,
                            bountyIndex: +bountyIndex,
                            curator: bounty.bounty.status.asActive.curator.toString(),
                            updateDue: +bounty.bounty.status.asActive.updateDue,
                        },
                    };
                }
                /**
                 * Elections Events
                 */
                case types_2.EventKind.ElectionNewTerm: {
                    const [newMembers] = event.data;
                    const section = api.query.electionsPhragmen
                        ? 'electionsPhragmen'
                        : 'elections';
                    const allMembers = yield api.query[section].members();
                    const round = yield api.query[section].electionRounds();
                    return {
                        data: {
                            kind,
                            round: +round,
                            newMembers: newMembers.map(([who]) => who.toString()),
                            allMembers: allMembers.map(([who]) => who.toString()),
                        },
                    };
                }
                case types_2.EventKind.ElectionEmptyTerm: {
                    const section = api.query.electionsPhragmen
                        ? 'electionsPhragmen'
                        : 'elections';
                    const allMembers = yield api.query[section].members();
                    const round = yield api.query[section].electionRounds();
                    return {
                        data: {
                            kind,
                            round: +round,
                            members: allMembers.map(([who]) => who.toString()),
                        },
                    };
                }
                case types_2.EventKind.ElectionMemberKicked:
                case types_2.EventKind.ElectionMemberRenounced: {
                    const [who] = event.data;
                    return {
                        data: {
                            kind,
                            who: who.toString(),
                        },
                    };
                }
                /**
                 * Collective Events
                 */
                case types_2.EventKind.CollectiveProposed: {
                    const [proposer, index, hash, threshold] = event.data;
                    const proposalOpt = yield api.query[event.section].proposalOf(hash);
                    if (!proposalOpt.isSome) {
                        throw new Error(`could not fetch method for collective proposal`);
                    }
                    return {
                        excludeAddresses: [proposer.toString()],
                        data: {
                            kind,
                            collectiveName: event.section === 'council' ||
                                event.section === 'technicalCommittee'
                                ? event.section
                                : undefined,
                            proposer: proposer.toString(),
                            proposalIndex: +index,
                            proposalHash: hash.toString(),
                            threshold: +threshold,
                            call: {
                                method: proposalOpt.unwrap().method,
                                section: proposalOpt.unwrap().section,
                                args: proposalOpt.unwrap().args.map((c) => c.toString()),
                            },
                        },
                    };
                }
                case types_2.EventKind.CollectiveVoted: {
                    const [voter, hash, vote] = event.data;
                    return {
                        excludeAddresses: [voter.toString()],
                        data: {
                            kind,
                            collectiveName: event.section === 'council' ||
                                event.section === 'technicalCommittee'
                                ? event.section
                                : undefined,
                            proposalHash: hash.toString(),
                            voter: voter.toString(),
                            vote: vote.isTrue,
                        },
                    };
                }
                case types_2.EventKind.CollectiveApproved:
                case types_2.EventKind.CollectiveDisapproved: {
                    const [hash] = event.data;
                    return {
                        data: {
                            kind,
                            collectiveName: event.section === 'council' ||
                                event.section === 'technicalCommittee'
                                ? event.section
                                : undefined,
                            proposalHash: hash.toString(),
                        },
                    };
                }
                case types_2.EventKind.CollectiveExecuted:
                case types_2.EventKind.CollectiveMemberExecuted: {
                    const [hash, executionOk] = event.data;
                    return {
                        data: {
                            kind,
                            collectiveName: event.section === 'council' ||
                                event.section === 'technicalCommittee'
                                ? event.section
                                : undefined,
                            proposalHash: hash.toString(),
                            executionOk: executionOk.isTrue,
                        },
                    };
                }
                /**
                 * Signaling Events
                 */
                case types_2.EventKind.SignalingNewProposal: {
                    const [proposer, hash] = event.data;
                    const proposalInfoOpt = yield api.query.signaling.proposalOf(hash);
                    if (!proposalInfoOpt.isSome) {
                        throw new Error(`unable to fetch signaling proposal info`);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const voteInfoOpt = yield api.query.voting.voteRecords(proposalInfoOpt.unwrap().vote_id);
                    if (!voteInfoOpt.isSome) {
                        throw new Error(`unable to fetch signaling proposal voting info`);
                    }
                    return {
                        excludeAddresses: [proposer.toString()],
                        data: {
                            kind,
                            proposer: proposer.toString(),
                            proposalHash: hash.toString(),
                            voteId: proposalInfoOpt.unwrap().vote_id.toString(),
                            title: proposalInfoOpt.unwrap().title.toString(),
                            description: proposalInfoOpt.unwrap().contents.toString(),
                            tallyType: voteInfoOpt.unwrap().data.tally_type.toString(),
                            voteType: voteInfoOpt.unwrap().data.vote_type.toString(),
                            choices: voteInfoOpt
                                .unwrap()
                                .outcomes.map((outcome) => outcome.toString()),
                        },
                    };
                }
                case types_2.EventKind.SignalingCommitStarted:
                case types_2.EventKind.SignalingVotingStarted: {
                    const [hash, voteId, endBlock] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            voteId: voteId.toString(),
                            endBlock: +endBlock,
                        },
                    };
                }
                case types_2.EventKind.SignalingVotingCompleted: {
                    const [hash, voteId] = event.data;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            voteId: voteId.toString(),
                        },
                    };
                }
                /**
                 * TreasuryReward events
                 */
                case types_2.EventKind.TreasuryRewardMinting: {
                    const [pot, reward] = event.data;
                    return {
                        data: {
                            kind,
                            pot: pot.toString(),
                            reward: reward.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryRewardMintingV2: {
                    const [pot, , potAddress] = event.data;
                    return {
                        data: {
                            kind,
                            pot: pot.toString(),
                            potAddress: potAddress.toString(),
                        },
                    };
                }
                /**
                 * Identity events
                 */
                case types_2.EventKind.IdentitySet: {
                    const [who] = event.data;
                    const registrationOpt = yield api.query.identity.identityOf(who);
                    if (!registrationOpt.isSome) {
                        throw new Error(`unable to retrieve identity info`);
                    }
                    const { info, judgements: judgementInfo } = registrationOpt.unwrap();
                    if (!info.display || !info.display.isRaw) {
                        throw new Error(`no display name set`);
                    }
                    const displayName = info.display.asRaw.toUtf8();
                    const judgements = [];
                    if (judgementInfo.length > 0) {
                        const registrars = yield api.query.identity.registrars();
                        judgements.push(...judgementInfo.map(([id, judgement]) => {
                            const registrarOpt = registrars[+id];
                            if (!registrarOpt || !registrarOpt.isSome) {
                                throw new Error(`invalid judgement!`);
                            }
                            return [
                                registrarOpt.unwrap().account.toString(),
                                types_2.parseJudgement(judgement),
                            ];
                        }));
                    }
                    return {
                        excludeAddresses: [who.toString()],
                        data: {
                            kind,
                            who: who.toString(),
                            displayName,
                            judgements,
                        },
                    };
                }
                case types_2.EventKind.JudgementGiven: {
                    const [who, registrarId] = event.data;
                    // convert registrar from id to address
                    const registrars = yield api.query.identity.registrars();
                    const registrarOpt = registrars[+registrarId];
                    if (!registrarOpt || !registrarOpt.isSome) {
                        throw new Error(`unable to retrieve registrar info`);
                    }
                    const registrar = registrarOpt.unwrap().account;
                    // query the actual judgement provided
                    const registrationOpt = yield api.query.identity.identityOf(who);
                    if (!registrationOpt.isSome) {
                        throw new Error(`unable to retrieve identity info`);
                    }
                    const judgementTuple = registrationOpt
                        .unwrap()
                        .judgements.find(([id]) => +id === +registrarId);
                    if (!judgementTuple) {
                        throw new Error(`unable to find judgement`);
                    }
                    const judgement = types_2.parseJudgement(judgementTuple[1]);
                    return {
                        data: {
                            kind,
                            who: who.toString(),
                            registrar: registrar.toString(),
                            judgement,
                        },
                    };
                }
                case types_2.EventKind.IdentityCleared: {
                    const [who] = event.data;
                    return {
                        excludeAddresses: [who.toString()],
                        data: {
                            kind,
                            who: who.toString(),
                        },
                    };
                }
                case types_2.EventKind.IdentityKilled: {
                    const [who] = event.data;
                    return {
                        data: {
                            kind,
                            who: who.toString(),
                        },
                    };
                }
                default: {
                    throw new Error(`unknown event type: ${kind}`);
                }
            }
        });
        const extractExtrinsicData = (extrinsic) => __awaiter(this, void 0, void 0, function* () {
            switch (kind) {
                case types_2.EventKind.DemocracySeconded: {
                    const voter = extrinsic.signer.toString();
                    const [proposal] = extrinsic.args;
                    return {
                        excludeAddresses: [voter],
                        data: {
                            kind,
                            proposalIndex: +proposal,
                            who: voter,
                        },
                    };
                }
                case types_2.EventKind.DemocracyVoted: {
                    const voter = extrinsic.signer.toString();
                    const [idx, vote] = extrinsic.args;
                    if (vote.isSplit) {
                        throw new Error(`split votes not supported`);
                    }
                    return {
                        excludeAddresses: [voter],
                        data: {
                            kind,
                            referendumIndex: +idx,
                            who: voter,
                            isAye: vote.asStandard.vote.isAye,
                            conviction: vote.asStandard.vote.conviction.index,
                            balance: vote.asStandard.balance.toString(),
                        },
                    };
                }
                case types_2.EventKind.ElectionCandidacySubmitted: {
                    const candidate = extrinsic.signer.toString();
                    const section = api.query.electionsPhragmen
                        ? 'electionsPhragmen'
                        : 'elections';
                    const round = yield api.query[section].electionRounds();
                    return {
                        excludeAddresses: [candidate],
                        data: {
                            kind,
                            round: +round,
                            candidate,
                        },
                    };
                }
                case types_2.EventKind.TipVoted: {
                    const voter = extrinsic.signer.toString();
                    const [hash, value] = extrinsic.args;
                    return {
                        data: {
                            kind,
                            proposalHash: hash.toString(),
                            who: voter,
                            value: value.toString(),
                        },
                    };
                }
                case types_2.EventKind.TreasuryBountyExtended: {
                    const [idx, remark] = extrinsic.args;
                    return {
                        data: {
                            kind,
                            bountyIndex: +idx,
                            remark: util_1.hexToString(remark.toString()),
                        },
                    };
                }
                default: {
                    throw new Error(`unknown event type: ${kind}`);
                }
            }
        });
        const eventData = yield (types_2.isEvent(rawData)
            ? extractEventData(rawData)
            : extractExtrinsicData(rawData));
        return eventData
            ? Object.assign(Object.assign({}, eventData), { blockNumber, network: interfaces_1.SupportedNetwork.Substrate }) : null;
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map