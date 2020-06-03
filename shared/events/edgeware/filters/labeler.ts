import BN from 'bn.js';

import { SubstrateBalanceString, SubstrateEventKind } from '../types';
import { IEventLabel, IChainEventData, LabelerFilter } from '../../interfaces';
import { SubstrateCoin } from '../../../adapters/chain/substrate/types';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 5)}…${addr.slice(addr.length - 3)}`;
}

// ideally we shouldn't hard-code this stuff, but we need the header to appear before the chain loads
const EDG_DECIMAL = 18;
const KUSAMA_DECIMAL = 15;

const edgBalanceFormatter = (chain, balance: SubstrateBalanceString): string => {
  const denom = chain === 'edgeware'
    ? 'EDG'
    : chain === 'edgeware-local' || chain === 'edgeware-testnet'
      ? 'tEDG'
      : chain === 'kusama'
        ? 'KSM'
        : chain === 'kusama-local'
          ? 'tKSM' : null;
  if (!denom) {
    throw new Error('unexpected chain');
  }
  let dollar;
  if (chain.startsWith('edgeware')) {
    dollar = (new BN(10)).pow(new BN(EDG_DECIMAL));
  } else if (chain.startsWith('kusama')) {
    dollar = (new BN(10)).pow(new BN(KUSAMA_DECIMAL));
  } else {
    throw new Error('unexpected chain');
  }
  const coin = new SubstrateCoin(denom, new BN(balance, 10), dollar);
  return coin.format(true);
};

/* eslint-disable max-len */
/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const labelEdgewareEvent: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IChainEventData,
): IEventLabel => {
  const balanceFormatter = (bal) => edgBalanceFormatter(chainId, bal);
  switch (data.kind) {
    /**
     * Staking Events
     */
    case SubstrateEventKind.Slash: {
      const { validator, amount } = data;
      return {
        heading: 'Validator Slashed',
        label: `Validator ${fmtAddr(validator)} was slashed by amount ${balanceFormatter(amount)}.`,
        // TODO: get link to validator page
      };
    }
    case SubstrateEventKind.Reward: {
      const { amount } = data;
      return {
        heading: 'Validator Rewarded',
        label: data.validator
          ? `Validator ${fmtAddr(data.validator)} was rewarded by amount ${balanceFormatter(amount)}.`
          : `All validators were rewarded by amount ${balanceFormatter(amount)}.`,
        // TODO: get link to validator page
      };
    }
    case SubstrateEventKind.Bonded: {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You bonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
        // TODO: should this link to controller or stash?
        linkUrl: chainId ? `/${chainId}/account/${stash}` : null,
      };
    }
    case SubstrateEventKind.Unbonded: {
      const { stash, controller, amount } = data;
      return {
        heading: 'Bonded',
        label: `You unbonded ${balanceFormatter(amount)} from controller ${fmtAddr(controller)} to stash ${fmtAddr(stash)}.`,
        // TODO: should this link to controller or stash?
        linkUrl: chainId ? `/${chainId}/account/${stash}` : null,
      };
    }

    /**
     * Democracy Events
     */
    case SubstrateEventKind.VoteDelegated: {
      const { who, target } = data;
      return {
        heading: 'Vote Delegated',
        label: `Your account ${fmtAddr(target)} received a voting delegation from ${fmtAddr(who)}.`,
        linkUrl: chainId ? `/${chainId}/account/${who}` : null,
      };
    }
    case SubstrateEventKind.DemocracyProposed: {
      const { deposit, proposalIndex } = data;
      return {
        heading: 'Democracy Proposal Created',
        label: `A new Democracy proposal was introduced with deposit ${balanceFormatter(deposit)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/democracyproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyTabled: {
      const { proposalIndex } = data;
      return {
        heading: 'Democracy Proposal Tabled',
        label: `Democracy proposal ${proposalIndex} has been tabled as a referendum.`,
        linkUrl: chainId ? `/${chainId}/proposal/democracyproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyStarted: {
      const { endBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Started',
        label: endBlock
          ? `Referendum ${referendumIndex} launched, and will be voting until block ${endBlock}.`
          : `Referendum ${referendumIndex} launched.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyPassed: {
      const { dispatchBlock, referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Passed',
        label: dispatchBlock
          ? `Referendum ${referendumIndex} passed and will be dispatched on block ${dispatchBlock}.`
          : `Referendum ${referendumIndex} passed was dispatched on block ${blockNumber}.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyNotPassed: {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Failed',
        // TODO: include final tally?
        label: `Referendum ${referendumIndex} has failed.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyCancelled: {
      const { referendumIndex } = data;
      return {
        heading: 'Democracy Referendum Cancelled',
        // TODO: include cancellation vote?
        label: `Referendum ${referendumIndex} was cancelled.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.DemocracyExecuted: {
      const { referendumIndex, executionOk } = data;
      return {
        heading: 'Democracy Referendum Executed',
        label: `Referendum ${referendumIndex} was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }

    /**
     * Preimage Events
     */
    case SubstrateEventKind.PreimageNoted: {
      const { proposalHash, noter } = data;
      return {
        heading: 'Preimage Noted',
        label: `A new preimage was noted by ${fmtAddr(noter)}.`,
        // TODO: the only way to get a link to (or text regarding) the related proposal here
        //    requires back-referencing the proposalHash with the index we use to identify the
        //    proposal.
        //  Alternatively, if we have a preimage-specific page (which would be nice, as we could
        //    display info about its corresponding Call), we can link to that, or we could instead
        //    link to the noter's profile.
      };
    }
    case SubstrateEventKind.PreimageUsed: {
      const { proposalHash, noter } = data;
      return {
        heading: 'Preimage Used',
        label: `A preimage noted by ${fmtAddr(noter)} was used.`,
        // TODO: see linkUrl comment above, on PreimageNoted.
      };
    }
    case SubstrateEventKind.PreimageInvalid: {
      const { proposalHash, referendumIndex } = data;
      return {
        heading: 'Preimage Invalid',
        label: `Preimage for referendum ${referendumIndex} was invalid.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.PreimageMissing: {
      const { proposalHash, referendumIndex } = data;
      return {
        heading: 'Preimage Missing',
        label: `Preimage for referendum ${referendumIndex} not found.`,
        linkUrl: chainId ? `/${chainId}/proposal/referendum/${referendumIndex}` : null,
      };
    }
    case SubstrateEventKind.PreimageReaped: {
      const { proposalHash, noter, reaper } = data;
      return {
        heading: 'Preimage Reaped',
        label: `A preimage noted by ${fmtAddr(noter)} was reaped by ${fmtAddr(reaper)}.`,
        // TODO: see linkURL comment above, but also we could link to the reaper?
      };
    }

    /**
     * Treasury Events
     */
    case SubstrateEventKind.TreasuryProposed: {
      const { proposalIndex, proposer, value } = data;
      return {
        heading: 'Treasury Proposal Created',
        label: `Treasury proposal ${proposalIndex} was introduced by ${fmtAddr(proposer)} for ${balanceFormatter(value)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.TreasuryAwarded: {
      const { proposalIndex, value, beneficiary } = data;
      return {
        heading: 'Treasury Proposal Awarded',
        label: `Treasury proposal ${proposalIndex} of ${balanceFormatter(value)} was awarded to ${fmtAddr(beneficiary)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}` : null,
      };
    }
    case SubstrateEventKind.TreasuryRejected: {
      const { proposalIndex } = data;
      return {
        heading: 'Treasury Proposal Rejected',
        label: `Treasury proposal ${proposalIndex} was rejected.`,
        linkUrl: chainId ? `/${chainId}/proposal/treasuryproposal/${proposalIndex}` : null,
      };
    }

    /**
     * Elections Events
     *
     * Note: all election events simply link to the council page.
     *   We may want to change this if deemed unnecessary.
     */
    case SubstrateEventKind.ElectionNewTerm: {
      const { newMembers } = data;
      return {
        heading: 'New Election Term Started',
        label: `A new election term started with ${newMembers.length} new members.`,
        // we just link to the council page here, so they can see the new members/results
        linkUrl: chainId ? `/${chainId}/council/` : null,
      };
    }
    case SubstrateEventKind.ElectionEmptyTerm: {
      return {
        heading: 'New Election Term Started',
        label: 'A new election term started with no new members.',
        linkUrl: chainId ? `/${chainId}/council/` : null,
      };
    }
    case SubstrateEventKind.ElectionCandidacySubmitted: {
      const { candidate } = data;
      return {
        heading: 'Council Candidate Submitted',
        label: `${fmtAddr(candidate)} submitted a candidacy for council.`,
        // TODO: this could also link to the member's page
        linkUrl: chainId ? `/${chainId}/council` : null,
      };
    }
    case SubstrateEventKind.ElectionMemberKicked: {
      const { who } = data;
      return {
        heading: 'Council Member Kicked',
        label: `Council member ${fmtAddr(who)} was kicked at end of term.`,
        // TODO: this could also link to the member's page
        linkUrl: chainId ? `/${chainId}/council/` : null,
      };
    }
    case SubstrateEventKind.ElectionMemberRenounced: {
      const { who } = data;
      return {
        heading: 'Council Member Renounced',
        label: `Candidate ${fmtAddr(who)} renounced their candidacy.`,
        // TODO: this could also link to the member's page
        linkUrl: chainId ? `/${chainId}/council/` : null,
      };
    }

    /**
     * Collective Events
     */
    case SubstrateEventKind.CollectiveProposed: {
      const { proposer, proposalHash, threshold, collectiveName } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
      return {
        heading: `New ${collective} Proposal`,
        label: `${fmtAddr(proposer)} introduced a new ${collective} proposal, requiring ${threshold} approvals to pass.`,
        linkUrl: chainId ? `/${chainId}/proposal/councilmotion/${proposalHash}` : null,
      };
    }
    case SubstrateEventKind.CollectiveVoted: {
      const { vote, proposalHash, collectiveName } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
      return {
        heading: `Member Voted on ${collective} Proposal`,
        label: `A council member has voted ${vote ? 'Yes' : 'No'} on a collective proposal.`,
        linkUrl: chainId ? `/${chainId}/proposal/councilmotion/${proposalHash}` : null,
      };
    }
    case SubstrateEventKind.CollectiveApproved: {
      const { proposalHash, collectiveName } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
      return {
        heading: `${collective} Proposal Approved`,
        label: `A ${collective} proposal was approved.`,
        linkUrl: chainId ? `/${chainId}/proposal/councilmotion/${proposalHash}` : null,
      };
    }
    case SubstrateEventKind.CollectiveDisapproved: {
      const { collectiveName, proposalHash } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
      return {
        heading: `${collective} Proposal Disapproved`,
        label: `A ${collective} proposal was disapproved.`,
        linkUrl: chainId ? `/${chainId}/proposal/councilmotion/${proposalHash}` : null,
      };
    }
    case SubstrateEventKind.CollectiveExecuted: {
      const { executionOk, collectiveName, proposalHash } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
      return {
        heading: `${collective} Proposal Executed`,
        label: `Approved ${collective} proposal was executed ${executionOk ? 'successfully' : 'unsuccessfully'}.`,
        linkUrl: chainId ? `/${chainId}/proposal/councilmotion/${proposalHash}` : null,
      };
    }
    case SubstrateEventKind.CollectiveMemberExecuted: {
      const { executionOk, collectiveName } = data;
      const collective = collectiveName && collectiveName === 'technicalCommittee'
        ? 'Technical Committee' : 'Council';
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
    case SubstrateEventKind.SignalingNewProposal: {
      const { proposer, voteId } = data;
      return {
        heading: 'New Signaling Proposal',
        label: `A new signaling proposal was created by ${fmtAddr(proposer)}.`,
        linkUrl: chainId ? `/${chainId}/proposal/signalingproposal/${voteId}` : null,
      };
    }
    case SubstrateEventKind.SignalingCommitStarted: {
      const { endBlock, voteId } = data;
      return {
        heading: 'Signaling Proposal Commit Started',
        label: `A signaling proposal's commit phase has started, lasting until block ${endBlock}.`,
        linkUrl: chainId ? `/${chainId}/proposal/signalingproposal/${voteId}` : null,
      };
    }
    case SubstrateEventKind.SignalingVotingStarted: {
      const { endBlock, voteId } = data;
      return {
        heading: 'Signaling Proposal Voting Started',
        label: `A signaling proposal's voting phase has started, lasting until block ${endBlock}.`,
        linkUrl: chainId ? `/${chainId}/proposal/signalingproposal/${voteId}` : null,
      };
    }
    case SubstrateEventKind.SignalingVotingCompleted: {
      const { voteId } = data;
      return {
        heading: 'Signaling Proposal Completed',
        label: 'A signaling proposal\'s voting phase has completed.',
        linkUrl: chainId ? `/${chainId}/proposal/signalingproposal/${voteId}` : null,
      };
    }

    /**
     * TreasuryReward events
     */
    case SubstrateEventKind.TreasuryRewardMinting: {
      const { pot, reward } = data;
      return {
        heading: 'Treasury Reward Minted',
        label: `A reward of size ${balanceFormatter(reward)} was minted. Treasury pot now of size ${balanceFormatter(pot)}.`
        // TODO: link to pot? or something?
      };
    }
    case SubstrateEventKind.TreasuryRewardMintingV2: {
      const { pot, potAddress } = data;
      return {
        heading: 'Treasury Reward Minted',
        label: `A treasury reward was minted, pot now of size ${balanceFormatter(pot)}.`
        // TODO: link to pot? or something?
      };
    }

    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};

export default labelEdgewareEvent;
