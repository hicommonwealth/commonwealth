"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Title = void 0;
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const Title = (kind, chain) => {
    switch (kind) {
        case types_1.EventKind.BalanceTransfer: {
            return {
                title: 'Balance Transferred',
                description: 'A balance transfer is performed.',
            };
        }
        /**
         * ImOnline Events
         */
        case types_1.EventKind.HeartbeatReceived: {
            return {
                title: 'Heartbeat Received',
                description: 'A new heartbeat is received .',
            };
        }
        case types_1.EventKind.SomeOffline: {
            return {
                title: 'Some validators were offline ',
                description: 'At the end of the session, at least one validator was found to be offline.',
            };
        }
        case types_1.EventKind.AllGood: {
            return {
                title: 'All validators were online ',
                description: 'At the end of the session, no offence was committed.',
            };
        }
        /**
         * Session Events
         */
        case types_1.EventKind.NewSession: {
            return {
                title: 'New Session',
                description: 'A new session begins.',
            };
        }
        /**
         * Offences Events
         */
        case types_1.EventKind.Offence: {
            return {
                title: 'Offence Reported',
                description: 'An offence of given type is reported at timeslot.',
            };
        }
        /**
         * Staking Events
         */
        case types_1.EventKind.Slash: {
            return {
                title: 'Validator Slash',
                description: 'Your validator is slashed.',
            };
        }
        case types_1.EventKind.Reward: {
            return {
                title: 'Validator Reward',
                description: 'Your validator is rewarded.',
            };
        }
        case types_1.EventKind.Bonded: {
            return {
                title: 'Stash Bonded',
                description: 'Your controller account bonds to a stash account.',
            };
        }
        case types_1.EventKind.Unbonded: {
            return {
                title: 'Stash Unbonded',
                description: 'Your controller account unbonds from a stash account.',
            };
        }
        case types_1.EventKind.StakingElection: {
            return {
                title: 'Staking Election',
                description: 'A new validator set is elected.',
            };
        }
        /**
         * Democracy Events
         */
        case types_1.EventKind.VoteDelegated: {
            return {
                title: 'Vote Delegated',
                description: 'You receive a voting delegation.',
            };
        }
        case types_1.EventKind.DemocracyProposed: {
            return {
                title: 'Democracy Proposed',
                description: 'A new community democracy proposal is introduced.',
            };
        }
        case types_1.EventKind.DemocracySeconded: {
            return {
                title: 'Democracy Proposal Seconded',
                description: 'A democracy proposal is seconded.',
            };
        }
        case types_1.EventKind.DemocracyTabled: {
            return {
                title: 'Democracy Proposal Tabled',
                description: 'A public democracy proposal is tabled to a referendum.',
            };
        }
        case types_1.EventKind.DemocracyStarted: {
            return {
                title: 'Referendum Started',
                description: 'A new democracy referendum started voting.',
            };
        }
        case types_1.EventKind.DemocracyVoted: {
            return {
                title: 'Democracy Vote Received',
                description: 'A democracy vote was received.',
            };
        }
        case types_1.EventKind.DemocracyPassed: {
            return {
                title: 'Referendum Passed',
                description: 'A democracy referendum finished voting and passed.',
            };
        }
        case types_1.EventKind.DemocracyNotPassed: {
            return {
                title: 'Referendum Failed',
                description: 'A democracy referendum finished voting and failed.',
            };
        }
        case types_1.EventKind.DemocracyCancelled: {
            return {
                title: 'Referendum Cancelled',
                description: 'A democracy referendum is cancelled.',
            };
        }
        case types_1.EventKind.DemocracyExecuted: {
            return {
                title: 'Referendum Executed',
                description: 'A passed democracy referendum is executed on chain.',
            };
        }
        /**
         * Preimage Events
         */
        case types_1.EventKind.PreimageNoted: {
            return {
                title: 'Preimage Noted',
                description: 'A preimage is noted for a democracy referendum.',
            };
        }
        case types_1.EventKind.PreimageUsed: {
            return {
                title: 'Preimage Used',
                description: "A democracy referendum's execution uses a preimage.",
            };
        }
        case types_1.EventKind.PreimageInvalid: {
            return {
                title: 'Preimage Invalid',
                description: "A democracy referendum's execution was attempted but the preimage is invalid.",
            };
        }
        case types_1.EventKind.PreimageMissing: {
            return {
                title: 'Preimage Missing',
                description: "A democracy referendum's execution was attempted but the preimage is missing.",
            };
        }
        case types_1.EventKind.PreimageReaped: {
            return {
                title: 'Preimage Reaped',
                description: 'A registered preimage is removed and the deposit is collected.',
            };
        }
        /**
         * Treasury Events
         */
        case types_1.EventKind.TreasuryProposed: {
            return {
                title: 'Treasury Proposed',
                description: 'A treasury spend is proposed.',
            };
        }
        case types_1.EventKind.TreasuryAwarded: {
            return {
                title: 'Treasury Awarded',
                description: 'A treasury spend is awarded.',
            };
        }
        case types_1.EventKind.TreasuryRejected: {
            return {
                title: 'Treasury Rejected',
                description: 'A treasury spend is rejected.',
            };
        }
        case types_1.EventKind.TreasuryBountyProposed: {
            return {
                title: 'Treasury Bounty Proposed',
                description: 'A treasury bounty is proposed.',
            };
        }
        case types_1.EventKind.TreasuryBountyAwarded: {
            return {
                title: 'Treasury Bounty Awarded',
                description: 'A treasury bounty is awarded.',
            };
        }
        case types_1.EventKind.TreasuryBountyRejected: {
            return {
                title: 'Treasury Bounty Rejected',
                description: 'A treasury bounty is rejected.',
            };
        }
        case types_1.EventKind.TreasuryBountyBecameActive: {
            return {
                title: 'Treasury Bounty Became Active',
                description: 'A treasury bounty became active.',
            };
        }
        case types_1.EventKind.TreasuryBountyClaimed: {
            return {
                title: 'Treasury Bounty Claimed',
                description: 'A treasury bounty is claimed.',
            };
        }
        case types_1.EventKind.TreasuryBountyCanceled: {
            return {
                title: 'Treasury Bounty Canceled',
                description: 'A treasury bounty is canceled.',
            };
        }
        case types_1.EventKind.TreasuryBountyExtended: {
            return {
                title: 'Treasury Bounty Expiry Extended',
                description: "A treasury bounty's expiry is extended.",
            };
        }
        /**
         * Elections Events
         */
        case types_1.EventKind.ElectionNewTerm: {
            return {
                title: 'New Election Term',
                description: 'A new election term begins with new members.',
            };
        }
        case types_1.EventKind.ElectionEmptyTerm: {
            return {
                title: 'Empty Election Term',
                description: 'A new election term begins with no member changes.',
            };
        }
        case types_1.EventKind.ElectionCandidacySubmitted: {
            return {
                title: 'Candidacy Submitted',
                description: 'Someone submits a council candidacy.',
            };
        }
        case types_1.EventKind.ElectionMemberKicked: {
            return {
                title: 'Member Kicked',
                description: 'A member is kicked at end of term.',
            };
        }
        case types_1.EventKind.ElectionMemberRenounced: {
            return {
                title: 'Member Renounced',
                description: 'A member renounces their candidacy for the next round.',
            };
        }
        /**
         * Collective Events
         */
        case types_1.EventKind.CollectiveProposed: {
            return {
                title: 'New Collective Proposal',
                description: 'A new collective proposal is introduced.',
            };
        }
        case types_1.EventKind.CollectiveVoted: {
            return {
                title: 'Collective Proposal Vote',
                description: 'A collective proposal receives a vote.',
            };
        }
        case types_1.EventKind.CollectiveApproved: {
            return {
                title: 'Collective Proposal Approved',
                description: 'A collective proposal is approved.',
            };
        }
        case types_1.EventKind.CollectiveDisapproved: {
            return {
                title: 'Collective Proposal Disapproved',
                description: 'A collective proposal is disapproved.',
            };
        }
        case types_1.EventKind.CollectiveExecuted: {
            return {
                title: 'Collective Proposal Executed',
                description: 'A collective proposal is executed.',
            };
        }
        case types_1.EventKind.CollectiveMemberExecuted: {
            return {
                title: 'Collective Member Execution',
                description: 'A collective member directly executes a proposal.',
            };
        }
        /**
         * Signaling Events
         */
        case types_1.EventKind.SignalingNewProposal: {
            return {
                title: 'New Signaling Proposal',
                description: 'A new signaling proposal is introduced.',
            };
        }
        case types_1.EventKind.SignalingCommitStarted: {
            return {
                title: 'Signaling Proposal Commit Started',
                description: "A signaling proposal's commit phase begins.",
            };
        }
        case types_1.EventKind.SignalingVotingStarted: {
            return {
                title: 'Signaling Proposal Voting Started',
                description: "A signaling proposal's voting phase begins.",
            };
        }
        case types_1.EventKind.SignalingVotingCompleted: {
            return {
                title: 'Signaling Proposal Voting Completed',
                description: 'A signaling proposal is completed.',
            };
        }
        /**
         * Tip Events
         */
        case types_1.EventKind.NewTip: {
            return {
                title: 'New Tip Suggested',
                description: 'A new tip is opened.',
            };
        }
        case types_1.EventKind.TipVoted: {
            return {
                title: 'Tip Voted',
                description: 'A tip is voted on.',
            };
        }
        case types_1.EventKind.TipClosing: {
            return {
                title: 'Tip Closing',
                description: 'A tip begins closing.',
            };
        }
        case types_1.EventKind.TipClosed: {
            return {
                title: 'Tip Closed',
                description: 'A tip is closed and paid out.',
            };
        }
        case types_1.EventKind.TipRetracted: {
            return {
                title: 'Tip Retracted',
                description: 'A tip is retracted.',
            };
        }
        case types_1.EventKind.TipSlashed: {
            return {
                title: 'Tip Slashed',
                description: 'A tip is slashed.',
            };
        }
        /**
         * TreasuryReward events
         */
        case types_1.EventKind.TreasuryRewardMinting:
        case types_1.EventKind.TreasuryRewardMintingV2: {
            return {
                title: 'Treasury Reward Minted',
                description: 'A reward is added to the treasury pot.',
            };
        }
        /**
         * Identity events
         */
        case types_1.EventKind.IdentitySet: {
            return {
                title: 'Identity Set',
                description: 'A user sets an identity.',
            };
        }
        case types_1.EventKind.JudgementGiven: {
            return {
                title: 'Identity Judgement Given',
                description: 'A registrar passes judgement on an identity.',
            };
        }
        case types_1.EventKind.IdentityCleared: {
            return {
                title: 'Identity Cleared',
                description: 'A user clears an identity.',
            };
        }
        case types_1.EventKind.IdentityKilled: {
            return {
                title: 'Identity Killed',
                description: "A user's identity is rejected.",
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error(`[${interfaces_1.SupportedNetwork.Substrate}${chain ? `::${chain}` : ''}]: unknown event type`);
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map