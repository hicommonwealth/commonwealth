"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const interfaces_1 = require("../../../interfaces");
const types_1 = require("../types");
function fmtAddr(addr) {
    if (!addr)
        return '';
    if (addr.length < 16)
        return addr;
    return `${addr.slice(0, 5)}…${addr.slice(addr.length - 3)}`;
}
// ideally we shouldn't hard-code this stuff, but we need the header to appear before the chain loads
const EDG_DECIMAL = 18;
const KUSAMA_DECIMAL = 12;
const KLP_DECIMAL = 12;
const FIS_DECIMAL = 12;
const CLOVER_DECIMAL = 12;
function formatNumberShort(num) {
    const round = (n, digits) => {
        if (digits === undefined)
            digits = 2;
        return Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits);
    };
    const precise = (n, digits) => {
        if (digits === undefined)
            digits = 3;
        return n.toPrecision(digits);
    };
    // TODO: Clean this up
    return num > 1000000000000
        ? `${round(num / 1000000000000)}t`
        : num > 1000000000
            ? `${round(num / 1000000000)}b`
            : num > 1000000
                ? `${round(num / 1000000)}m`
                : num > 1000
                    ? `${round(num / 1000)}k`
                    : num > 0.1
                        ? round(num)
                        : num > 0.01
                            ? precise(num, 2)
                            : num > 0.001
                                ? precise(num, 1)
                                : num.toString();
}
const getDenom = (chain) => {
    switch (chain) {
        case 'clover':
            return 'CLV';
        case 'edgeware':
            return 'EDG';
        case 'edgeware-local':
        case 'edgeware-testnet':
            return 'tEDG';
        case 'hydradx':
            return 'HDX';
        case 'kusama':
            return 'KSM';
        case 'kusama-local':
            return 'tKSM';
        case 'kulupu':
            return 'KLP';
        case 'stafi':
            return 'FIS';
        case 'polkadot':
            return 'DOT';
        case 'polkadot-local':
            return 'tDOT';
        default: {
            throw new Error(`[Substrate::${chain}]: invalid chain`);
        }
    }
};
const edgBalanceFormatter = (chain, balance) => {
    const denom = getDenom(chain);
    let dollar;
    if (chain.startsWith('edgeware')) {
        dollar = new bn_js_1.default(10).pow(new bn_js_1.default(EDG_DECIMAL));
    }
    else if (chain.startsWith('kusama') || chain.startsWith('polkadot')) {
        dollar = new bn_js_1.default(10).pow(new bn_js_1.default(KUSAMA_DECIMAL));
    }
    else if (chain.startsWith('kulupu')) {
        dollar = new bn_js_1.default(10).pow(new bn_js_1.default(KLP_DECIMAL));
    }
    else if (chain.startsWith('stafi')) {
        dollar = new bn_js_1.default(10).pow(new bn_js_1.default(FIS_DECIMAL));
    }
    else if (chain.startsWith('clover')) {
        dollar = new bn_js_1.default(10).pow(new bn_js_1.default(CLOVER_DECIMAL));
    }
    else {
        throw new Error(`[Substrate::${chain}]: unexpected chain`);
    }
    const balanceDollars = new bn_js_1.default(balance, 10).div(dollar);
    return `${formatNumberShort(+balanceDollars)} ${denom}`;
};
/* eslint-disable max-len */
/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const Label = (blockNumber, chainId, data) => {
    const balanceFormatter = (bal) => edgBalanceFormatter(chainId, bal);
    switch (data.kind) {
        case types_1.EventKind.BalanceTransfer: {
            const { sender, dest, value } = data;
            return {
                heading: 'Balance Transferred',
                label: `${fmtAddr(sender)} transferred ${balanceFormatter(value)} to ${fmtAddr(dest)}.`,
            };
        }
        /**
         * ImOnline Events
         */
        case types_1.EventKind.HeartbeatReceived: {
            const { authorityId } = data;
            return {
                heading: 'Heartbeat Received',
                label: `A heartbeat was received from ${fmtAddr(authorityId)}.`,
            };
        }
        case types_1.EventKind.SomeOffline: {
            const { sessionIndex } = data;
            return {
                heading: 'Some Offline',
                label: `At least one validator went offline during session ${sessionIndex}.`,
            };
        }
        case types_1.EventKind.AllGood: {
            const { sessionIndex } = data;
            return {
                heading: 'All Good',
                label: `No validators committed offences during session ${sessionIndex}.`,
            };
        }
        /**
         * Session Events
         */
        case types_1.EventKind.NewSession: {
            const { sessionIndex } = data;
            return {
                heading: 'New Session',
                label: `Session ${sessionIndex.toString()} started.`,
                // TODO: get link to validator page
            };
        }
        /**
         * Offences Events
         */
        case types_1.EventKind.Offence: {
            const { offenceKind, opaqueTimeSlot, applied } = data;
            return {
                heading: 'Offence',
                label: `An offence of type ${offenceKind} was reported and ${applied ? 'penalties applied' : 'penalties queued'} at time ${opaqueTimeSlot}.`,
                linkUrl: chainId ? `/${chainId}/validators` : null,
            };
        }
        /**
         * Staking Events
         */
        case types_1.EventKind.Slash: {
            const { validator, amount } = data;
            return {
                heading: 'Validator Slashed',
                label: `Validator ${fmtAddr(validator)} was slashed by amount ${balanceFormatter(amount)}.`,
                // TODO: get link to validator page
            };
        }
        case types_1.EventKind.Reward: {
            const { amount } = data;
            return {
                heading: 'Validator Rewarded',
                label: data.validator
                    ? `Validator ${fmtAddr(data.validator)} was rewarded by amount ${balanceFormatter(amount)}.`
                    : `All validators were rewarded by amount ${balanceFormatter(amount)}.`,
                // TODO: get link to validator page
            };
        }
        case types_1.EventKind.Bonded: {
            const { stash, controller, amount } = data;
            return {
                heading: 'Bonded',
                label: `${balanceFormatter(amount)} was bonded by controller ${fmtAddr(controller)} on stash ${fmtAddr(stash)}.`,
                // TODO: should this link to controller or stash?
                linkUrl: chainId ? `/${chainId}/account/${stash}` : null,
            };
        }
        case types_1.EventKind.Unbonded: {
            const { stash, controller, amount } = data;
            return {
                heading: 'Bonded',
                label: `${balanceFormatter(amount)} was unbonded by controller ${fmtAddr(controller)} on stash ${fmtAddr(stash)}.`,
                // TODO: should this link to controller or stash?
                linkUrl: chainId ? `/${chainId}/account/${stash}` : null,
            };
        }
        case types_1.EventKind.StakingElection: {
            const { era } = data;
            return {
                heading: 'Staking Election',
                label: `A new validator set was elected for era ${era}.`,
            };
        }
        /**
         * Democracy Events
         */
        case types_1.EventKind.VoteDelegated: {
            const { who, target } = data;
            return {
                heading: 'Vote Delegated',
                label: `${fmtAddr(target)} received a voting delegation from ${fmtAddr(who)}.`,
                linkUrl: chainId ? `/${chainId}/account/${who}` : null,
            };
        }
        case types_1.EventKind.DemocracyProposed: {
            const { deposit, proposalIndex } = data;
            return {
                heading: 'Democracy Proposal Created',
                label: `Democracy proposal ${proposalIndex} was introduced with a deposit of ${balanceFormatter(deposit)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/democracyproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracySeconded: {
            const { proposalIndex, who } = data;
            return {
                heading: 'Democracy Proposal Created',
                label: `Democracy proposal ${proposalIndex} was seconded by ${fmtAddr(who)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/democracyproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyTabled: {
            const { proposalIndex } = data;
            return {
                heading: 'Democracy Proposal Tabled',
                label: `Democracy proposal ${proposalIndex} was tabled as a referendum.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/democracyproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyStarted: {
            const { endBlock, referendumIndex } = data;
            return {
                heading: 'Democracy Referendum Started',
                label: endBlock
                    ? `Referendum ${referendumIndex} started voting, and will be in voting until block ${endBlock}.`
                    : `Referendum ${referendumIndex} started voting.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyVoted: {
            const { referendumIndex, who, isAye } = data;
            return {
                heading: 'Vote Received on Democracy Referendum',
                label: `Voter ${fmtAddr(who)} voted ${isAye ? 'Yes' : 'No'} on referendum ${referendumIndex}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyPassed: {
            const { dispatchBlock, referendumIndex } = data;
            return {
                heading: 'Democracy Referendum Passed',
                label: dispatchBlock
                    ? `Referendum ${referendumIndex} passed, and will be executed on block ${dispatchBlock}.`
                    : `Referendum ${referendumIndex} passed, and was executed on block ${blockNumber}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyNotPassed: {
            const { referendumIndex } = data;
            return {
                heading: 'Democracy Referendum Failed',
                label: `Referendum ${referendumIndex} failed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyCancelled: {
            const { referendumIndex } = data;
            return {
                heading: 'Democracy Referendum Cancelled',
                label: `Referendum ${referendumIndex} was cancelled.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.DemocracyExecuted: {
            const { referendumIndex, executionOk } = data;
            return {
                heading: 'Democracy Referendum Executed',
                label: `Referendum ${referendumIndex} was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        /**
         * Preimage Events
         */
        case types_1.EventKind.PreimageNoted: {
            const { noter } = data;
            return {
                heading: 'Preimage Noted',
                label: `A new preimage was provided by ${fmtAddr(noter)}.`,
                // TODO: the only way to get a link to (or text regarding) the related proposal here
                //    requires back-referencing the proposalHash with the index we use to identify the
                //    proposal.
                //  Alternatively, if we have a preimage-specific page (which would be nice, as we could
                //    display info about its corresponding Call), we can link to that, or we could instead
                //    link to the noter's profile.
            };
        }
        case types_1.EventKind.PreimageUsed: {
            const { noter } = data;
            return {
                heading: 'Preimage Used',
                label: `A preimage provided by ${fmtAddr(noter)} was used.`,
                // TODO: see linkUrl comment above, on PreimageNoted.
            };
        }
        case types_1.EventKind.PreimageInvalid: {
            const { referendumIndex } = data;
            return {
                heading: 'Preimage Invalid',
                label: `A preimage for referendum ${referendumIndex} was found to be invalid.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.PreimageMissing: {
            const { referendumIndex } = data;
            return {
                heading: 'Preimage Missing',
                label: `A preimage for referendum ${referendumIndex} was not found.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/referendum/${referendumIndex}`
                    : null,
            };
        }
        case types_1.EventKind.PreimageReaped: {
            const { noter, reaper } = data;
            return {
                heading: 'Preimage Reaped',
                label: `A preimage noted by ${fmtAddr(noter)} was cleaned up from the chain by ${fmtAddr(reaper)}.`,
                // TODO: see linkURL comment above, but also we could link to the reaper?
            };
        }
        /**
         * Treasury Events
         */
        case types_1.EventKind.TreasuryProposed: {
            const { proposalIndex, proposer, value } = data;
            return {
                heading: 'Treasury Proposal Created',
                label: `Treasury proposal ${proposalIndex} was introduced by ${fmtAddr(proposer)} for ${balanceFormatter(value)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryAwarded: {
            const { proposalIndex, value, beneficiary } = data;
            return {
                heading: 'Treasury Proposal Awarded',
                label: `Treasury proposal ${proposalIndex} was awarded to ${fmtAddr(beneficiary)} for ${balanceFormatter(value)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryRejected: {
            const { proposalIndex } = data;
            return {
                heading: 'Treasury Proposal Rejected',
                label: `Treasury proposal ${proposalIndex} was rejected.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyProposed: {
            const { bountyIndex } = data;
            return {
                heading: 'Treasury Bounty Proposed',
                label: `Treasury bounty ${bountyIndex} was proposed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyAwarded: {
            const { bountyIndex, beneficiary } = data;
            return {
                heading: 'Treasury Bounty Awarded',
                label: `Treasury bounty ${bountyIndex} was awarded to ${beneficiary}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyRejected: {
            const { bountyIndex, bond } = data;
            return {
                heading: 'Treasury Bounty Rejected',
                label: `Treasury bounty ${bountyIndex} with bond ${bond} was rejected.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyBecameActive: {
            const { bountyIndex } = data;
            return {
                heading: 'Treasury Bounty Became Active',
                label: `Treasury bounty ${bountyIndex} became active.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyClaimed: {
            const { bountyIndex, payout, beneficiary } = data;
            return {
                heading: 'Treasury Bounty Claimed',
                label: `${beneficiary} claimed Treasury Bounty ${bountyIndex}, worth ${payout}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyCanceled: {
            const { bountyIndex } = data;
            return {
                heading: 'Treasury Bounty Canceled',
                label: `Treasury bounty ${bountyIndex} was canceled.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        case types_1.EventKind.TreasuryBountyExtended: {
            const { bountyIndex } = data;
            return {
                heading: 'Treasury Bounty Expiry Extended',
                label: `Treasury bounty ${bountyIndex} expiry was extended.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/treasurybounty/${bountyIndex}`
                    : null,
            };
        }
        /**
         * Elections Events
         *
         * Note: all election events simply link to the council page.
         *   We may want to change this if deemed unnecessary.
         */
        case types_1.EventKind.ElectionNewTerm: {
            const { newMembers } = data;
            return {
                heading: 'New Election Term Started',
                label: `A new election term started with ${newMembers.length} new member${newMembers.length !== 1 ? 's' : ''}.`,
                // we just link to the council page here, so they can see the new members/results
                linkUrl: chainId ? `/${chainId}/council/` : null,
            };
        }
        case types_1.EventKind.ElectionEmptyTerm: {
            return {
                heading: 'New Election Term Started',
                label: 'A new election term started with no new members.',
                linkUrl: chainId ? `/${chainId}/council/` : null,
            };
        }
        case types_1.EventKind.ElectionCandidacySubmitted: {
            const { candidate } = data;
            return {
                heading: 'Council Candidate Submitted',
                label: `${fmtAddr(candidate)} submitted a candidacy for council.`,
                // TODO: this could also link to the member's page
                linkUrl: chainId ? `/${chainId}/council` : null,
            };
        }
        case types_1.EventKind.ElectionMemberKicked: {
            const { who } = data;
            return {
                heading: 'Council Member Kicked',
                label: `${fmtAddr(who)} left the council.`,
                // TODO: this could also link to the member's page
                linkUrl: chainId ? `/${chainId}/council/` : null,
            };
        }
        case types_1.EventKind.ElectionMemberRenounced: {
            const { who } = data;
            return {
                heading: 'Council Member Renounced',
                label: `${fmtAddr(who)} renounced their council candidacy.`,
                // TODO: this could also link to the member's page
                linkUrl: chainId ? `/${chainId}/council/` : null,
            };
        }
        /**
         * Collective Events
         */
        case types_1.EventKind.CollectiveProposed: {
            const { proposer, proposalHash, threshold, collectiveName } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `New ${collective} Proposal`,
                label: `${fmtAddr(proposer)} introduced a new ${collective} proposal, requiring ${threshold} approvals to pass.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/councilmotion/${proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.CollectiveVoted: {
            const { vote, proposalHash, collectiveName } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `Member Voted on ${collective} Proposal`,
                label: `A council member voted ${vote ? 'Yes' : 'No'} on a collective proposal.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/councilmotion/${proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.CollectiveApproved: {
            const { proposalHash, collectiveName } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `${collective} Proposal Approved`,
                label: `A ${collective} proposal was approved.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/councilmotion/${proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.CollectiveDisapproved: {
            const { collectiveName, proposalHash } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `${collective} Proposal Disapproved`,
                label: `A ${collective} proposal was disapproved.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/councilmotion/${proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.CollectiveExecuted: {
            const { executionOk, collectiveName, proposalHash } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `${collective} Proposal Executed`,
                label: `Approved ${collective} proposal was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/councilmotion/${proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.CollectiveMemberExecuted: {
            const { executionOk, collectiveName } = data;
            const collective = collectiveName && collectiveName === 'technicalCommittee'
                ? 'Technical Committee'
                : 'Council';
            return {
                heading: `${collective} Proposal Executed`,
                label: `A member-executed ${collective} proposal was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
                // no proposal link will exist, because this happens immediately, without creating a proposal
                // TODO: maybe link to the executing member?
            };
        }
        /**
         * Signaling Events
         */
        case types_1.EventKind.SignalingNewProposal: {
            const { proposer, voteId } = data;
            return {
                heading: 'New Signaling Proposal',
                label: `A new signaling proposal was created by ${fmtAddr(proposer)}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/signalingproposal/${voteId}`
                    : null,
            };
        }
        case types_1.EventKind.SignalingCommitStarted: {
            const { endBlock, voteId } = data;
            return {
                heading: 'Signaling Proposal Commit Started',
                label: `A signaling proposal's commit phase started, and will last until block ${endBlock}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/signalingproposal/${voteId}`
                    : null,
            };
        }
        case types_1.EventKind.SignalingVotingStarted: {
            const { endBlock, voteId } = data;
            return {
                heading: 'Signaling Proposal Voting Started',
                label: `A signaling proposal's voting phase started, and will last until block ${endBlock}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/signalingproposal/${voteId}`
                    : null,
            };
        }
        case types_1.EventKind.SignalingVotingCompleted: {
            const { voteId } = data;
            return {
                heading: 'Signaling Proposal Completed',
                label: "A signaling proposal's voting phase completed.",
                linkUrl: chainId
                    ? `/${chainId}/proposal/signalingproposal/${voteId}`
                    : null,
            };
        }
        /**
         * Tip Events
         */
        case types_1.EventKind.NewTip: {
            return {
                heading: 'New Tip Suggested',
                label: `A new tip for ${fmtAddr(data.who)} was suggested with reason "${data.reason}".`,
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.TipVoted: {
            return {
                heading: 'Tip Voted',
                label: `A tip was voted on by ${data.who} for ${balanceFormatter(data.value)}.`,
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.TipClosing: {
            return {
                heading: 'Tip Closing',
                label: `A tip is now closing on block ${data.closing}.`,
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.TipClosed: {
            return {
                heading: 'Tip Closed',
                label: `A tip to ${fmtAddr(data.who)} was paid out for ${balanceFormatter(data.payout)}.`,
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.TipRetracted: {
            return {
                heading: 'Tip Retracted',
                label: 'A tip was retracted.',
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        case types_1.EventKind.TipSlashed: {
            return {
                heading: 'Tip Slashed',
                label: `A tip submitted by ${fmtAddr(data.finder)} slashed for ${balanceFormatter(data.deposit)}`,
                // TODO: fix
                linkUrl: chainId
                    ? `/${chainId}/proposal/tip/${data.proposalHash}`
                    : null,
            };
        }
        /**
         * TreasuryReward events
         */
        case types_1.EventKind.TreasuryRewardMinting: {
            const { pot, reward } = data;
            return {
                heading: 'Treasury Reward Minted',
                label: `A treasury reward of ${balanceFormatter(reward)} was minted. The treasury now has a balance of ${balanceFormatter(pot)}.`,
                // TODO: link to pot? or something?
            };
        }
        case types_1.EventKind.TreasuryRewardMintingV2: {
            const { pot } = data;
            return {
                heading: 'Treasury Reward Minted',
                label: `A treasury reward was minted. The treasury now has a balance of ${balanceFormatter(pot)}.`,
                // TODO: link to pot? or something?
            };
        }
        /**
         * Identity events
         */
        case types_1.EventKind.IdentitySet: {
            const { who, displayName } = data;
            return {
                heading: 'Identity Set',
                label: `${fmtAddr(who)} set their identity with display name "${displayName}".`,
                linkUrl: chainId ? `/${chainId}/account/${who}` : null,
            };
        }
        case types_1.EventKind.JudgementGiven: {
            const { who, registrar, judgement } = data;
            return {
                heading: 'Identity Judgement Given',
                label: `Registrar ${fmtAddr(registrar)} passed judgement '${judgement}' on ${fmtAddr(who)}.`,
                linkUrl: chainId ? `/${chainId}/account/${who}` : null,
            };
        }
        case types_1.EventKind.IdentityCleared: {
            const { who } = data;
            return {
                heading: 'Identity Cleared',
                label: `${fmtAddr(who)} cleared their identity.`,
                linkUrl: chainId ? `/${chainId}/account/${who}` : null,
            };
        }
        case types_1.EventKind.IdentityKilled: {
            const { who } = data;
            return {
                heading: 'Identity Killed',
                label: `${fmtAddr(who)}'s identity was removed.`,
                linkUrl: chainId ? `/${chainId}/account/${who}` : null,
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error(`[${interfaces_1.SupportedNetwork.Substrate}::${chainId}]: Unknown event type`);
        }
    }
};
exports.Label = Label;
//# sourceMappingURL=labeler.js.map