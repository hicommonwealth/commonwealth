"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseType = void 0;
const types_1 = require("../types");
/**
 * This is the Type Parser function, which takes a raw Substrate chain Event
 * and determines which of our local event kinds it belongs to.
 */
function ParseType(versionName, versionNumber, section, method) {
    // TODO: we can unify this with the enricher file: parse out the kind, and then
    //   marshall the rest of the types in the same place. But for now, we can leave as-is.
    switch (section) {
        case 'balances': {
            switch (method) {
                case 'Transfer':
                    return types_1.EventKind.BalanceTransfer;
                default:
                    return null;
            }
        }
        case 'imOnline':
            switch (method) {
                case 'AllGood':
                    return types_1.EventKind.AllGood;
                case 'HeartbeatReceived':
                    return types_1.EventKind.HeartbeatReceived;
                case 'SomeOffline':
                    return types_1.EventKind.SomeOffline;
                default:
                    return null;
            }
        case 'session':
            switch (method) {
                case 'NewSession':
                    return types_1.EventKind.NewSession;
                default:
                    return null;
            }
        case 'staking':
            switch (method) {
                case 'Slash':
                    return types_1.EventKind.Slash;
                case 'Reward':
                    return types_1.EventKind.Reward;
                // NOTE: these are not supported yet on Edgeware, only kusama and edgeware-develop
                case 'Bonded':
                    return types_1.EventKind.Bonded;
                case 'Unbonded':
                    return types_1.EventKind.Unbonded;
                case 'StakingElection':
                    return types_1.EventKind.StakingElection;
                default:
                    return null;
            }
        case 'democracy':
            switch (method) {
                case 'Proposed':
                    return types_1.EventKind.DemocracyProposed;
                case 'second':
                    return types_1.EventKind.DemocracySeconded;
                case 'Tabled':
                    return types_1.EventKind.DemocracyTabled;
                case 'Started':
                    return types_1.EventKind.DemocracyStarted;
                case 'Passed':
                    return types_1.EventKind.DemocracyPassed;
                case 'NotPassed':
                    return types_1.EventKind.DemocracyNotPassed;
                case 'Cancelled':
                    return types_1.EventKind.DemocracyCancelled;
                case 'Executed':
                    return types_1.EventKind.DemocracyExecuted;
                case 'Delegated':
                    return types_1.EventKind.VoteDelegated;
                case 'PreimageNoted':
                    return types_1.EventKind.PreimageNoted;
                case 'PreimageUsed':
                    return types_1.EventKind.PreimageUsed;
                case 'PreimageInvalid':
                    return types_1.EventKind.PreimageInvalid;
                case 'PreimageMissing':
                    return types_1.EventKind.PreimageMissing;
                case 'PreimageReaped':
                    return types_1.EventKind.PreimageReaped;
                case 'vote':
                    return types_1.EventKind.DemocracyVoted;
                default:
                    return null;
            }
        case 'treasury':
            switch (method) {
                case 'Proposed':
                    return types_1.EventKind.TreasuryProposed;
                case 'Awarded':
                    return types_1.EventKind.TreasuryAwarded;
                case 'Rejected':
                    return types_1.EventKind.TreasuryRejected;
                default:
                    return null;
            }
        case 'elections':
        case 'electionsPhragmen':
            switch (method) {
                case 'submitCandidacy':
                    return types_1.EventKind.ElectionCandidacySubmitted;
                case 'NewTerm':
                    return types_1.EventKind.ElectionNewTerm;
                case 'EmptyTerm':
                    return types_1.EventKind.ElectionEmptyTerm;
                case 'MemberKicked':
                    return types_1.EventKind.ElectionMemberKicked;
                case 'MemberRenounced':
                    return types_1.EventKind.ElectionMemberRenounced;
                default:
                    return null;
            }
        case 'collective':
        case 'council':
        case 'technicalCollective':
            switch (method) {
                case 'Proposed':
                    return types_1.EventKind.CollectiveProposed;
                case 'Voted':
                    return types_1.EventKind.CollectiveVoted;
                case 'Approved':
                    return types_1.EventKind.CollectiveApproved;
                case 'Disapproved':
                    return types_1.EventKind.CollectiveDisapproved;
                case 'Executed':
                    return types_1.EventKind.CollectiveExecuted;
                case 'MemberExecuted':
                    return types_1.EventKind.CollectiveMemberExecuted;
                default:
                    return null;
            }
        case 'signaling':
            switch (method) {
                case 'NewProposal':
                    return types_1.EventKind.SignalingNewProposal;
                case 'CommitStarted':
                    return types_1.EventKind.SignalingCommitStarted;
                case 'VotingStarted':
                    return types_1.EventKind.SignalingVotingStarted;
                case 'VotingCompleted':
                    return types_1.EventKind.SignalingVotingCompleted;
                default:
                    return null;
            }
        case 'tips':
            switch (method) {
                case 'NewTip': {
                    return types_1.EventKind.NewTip;
                }
                // extrinsic call tip()
                case 'tip': {
                    return types_1.EventKind.TipVoted;
                }
                case 'TipClosing': {
                    return types_1.EventKind.TipClosing;
                }
                case 'TipClosed': {
                    return types_1.EventKind.TipClosed;
                }
                case 'TipRetracted': {
                    return types_1.EventKind.TipRetracted;
                }
                case 'TipSlashed': {
                    return types_1.EventKind.TipSlashed;
                }
                default: {
                    return null;
                }
            }
        case 'treasuryReward':
            switch (method) {
                case 'TreasuryMinting': {
                    if (versionNumber < 34) {
                        return types_1.EventKind.TreasuryRewardMinting;
                    }
                    return types_1.EventKind.TreasuryRewardMintingV2;
                }
                default:
                    return null;
            }
        case 'identity': {
            switch (method) {
                case 'IdentitySet':
                    return types_1.EventKind.IdentitySet;
                case 'JudgementGiven':
                    return types_1.EventKind.JudgementGiven;
                case 'IdentityCleared':
                    return types_1.EventKind.IdentityCleared;
                case 'IdentityKilled':
                    return types_1.EventKind.IdentityKilled;
                default:
                    return null;
            }
        }
        case 'offences': {
            switch (method) {
                case 'Offence':
                    return types_1.EventKind.Offence;
                default:
                    return null;
            }
        }
        case 'bounties': {
            switch (method) {
                case 'BountyProposed':
                    return types_1.EventKind.TreasuryBountyProposed;
                case 'BountyRejected':
                    return types_1.EventKind.TreasuryBountyRejected;
                case 'BountyBecameActive':
                    return types_1.EventKind.TreasuryBountyBecameActive;
                case 'BountyAwarded':
                    return types_1.EventKind.TreasuryBountyAwarded;
                case 'BountyClaimed':
                    return types_1.EventKind.TreasuryBountyClaimed;
                case 'BountyCanceled':
                    return types_1.EventKind.TreasuryBountyCanceled;
                case 'extendBountyExpiry':
                    return types_1.EventKind.TreasuryBountyExtended;
                default:
                    return null;
            }
        }
        default:
            return null;
    }
}
exports.ParseType = ParseType;
