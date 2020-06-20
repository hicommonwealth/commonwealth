import { SubstrateEventKind } from '../types';
import { IEventTitle, TitlerFilter } from '../../interfaces';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const titlerFunc: TitlerFilter = (kind: SubstrateEventKind): IEventTitle => {
  switch (kind) {
    /**
     * Staking Events
     */
    case SubstrateEventKind.Slash: {
      return {
        title: 'Validator Slash',
        description: 'Your validator is slashed.',
      };
    }
    case SubstrateEventKind.Reward: {
      return {
        title: 'Validator Reward',
        description: 'Your validator is rewarded.',
      };
    }
    case SubstrateEventKind.Bonded: {
      return {
        title: 'Stash Bonded',
        description: 'Your controller account bonds to a stash account.',
      };
    }
    case SubstrateEventKind.Unbonded: {
      return {
        title: 'Stash Unbonded',
        description: 'Your controller account unbonds from a stash account.',
      };
    }

    /**
     * Offences Events
     */
    case SubstrateEventKind.Offence: {
      return {
        title: 'Offence Reported',
        description: 'An offence of given type is reported at timeslot.',
      };
    }

    /**
     * Democracy Events
     */
    case SubstrateEventKind.VoteDelegated: {
      return {
        title: 'Vote Delegated',
        description: 'You receive a voting delegation.',
      };
    }
    case SubstrateEventKind.DemocracyProposed: {
      return {
        title: 'Democracy Proposed',
        description: 'A new community democracy proposal is introduced.',
      };
    }
    case SubstrateEventKind.DemocracyTabled: {
      return {
        title: 'Democracy Proposal Tabled',
        description: 'A public democracy proposal is tabled to a referendum.',
      };
    }
    case SubstrateEventKind.DemocracyStarted: {
      return {
        title: 'Referendum Started',
        description: 'A new democracy referendum started voting.',
      };
    }
    case SubstrateEventKind.DemocracyPassed: {
      return {
        title: 'Referendum Passed',
        description: 'A democracy referendum finished voting and passed.',
      };
    }
    case SubstrateEventKind.DemocracyNotPassed: {
      return {
        title: 'Referendum Failed',
        description: 'A democracy referendum finished voting and failed.',
      };
    }
    case SubstrateEventKind.DemocracyCancelled: {
      return {
        title: 'Referendum Cancelled',
        description: 'A democracy referendum is cancelled.',
      };
    }
    case SubstrateEventKind.DemocracyExecuted: {
      return {
        title: 'Referendum Executed',
        description: 'A passed democracy referendum is executed on chain.',
      };
    }

    /**
     * Preimage Events
     */
    case SubstrateEventKind.PreimageNoted: {
      return {
        title: 'Preimage Noted',
        description: 'A preimage is noted for a democracy referendum.',
      };
    }
    case SubstrateEventKind.PreimageUsed: {
      return {
        title: 'Preimage Used',
        description: 'A democracy referendum\'s execution uses a preimage.',
      };
    }
    case SubstrateEventKind.PreimageInvalid: {
      return {
        title: 'Preimage Invalid',
        description: 'A democracy referendum\'s execution was attempted but the preimage is invalid.',
      };
    }
    case SubstrateEventKind.PreimageMissing: {
      return {
        title: 'Preimage Missing',
        description: 'A democracy referendum\'s execution was attempted but the preimage is missing.',
      };
    }
    case SubstrateEventKind.PreimageReaped: {
      return {
        title: 'Preimage Reaped',
        description: 'A registered preimage is removed and the deposit is collected.',
      };
    }

    /**
     * Treasury Events
     */
    case SubstrateEventKind.TreasuryProposed: {
      return {
        title: 'Treasury Proposed',
        description: 'A treasury spend is proposed.',
      };
    }
    case SubstrateEventKind.TreasuryAwarded: {
      return {
        title: 'Treasury Awarded',
        description: 'A treasury spend is awarded.',
      };
    }
    case SubstrateEventKind.TreasuryRejected: {
      return {
        title: 'Treasury Rejected',
        description: 'A treasury spend is rejected.',
      };
    }

    /**
     * Elections Events
     */
    case SubstrateEventKind.ElectionNewTerm: {
      return {
        title: 'New Election Term',
        description: 'A new election term begins with new members.',
      };
    }
    case SubstrateEventKind.ElectionEmptyTerm: {
      return {
        title: 'Empty Election Term',
        description: 'A new election term begins with no member changes.',
      };
    }
    case SubstrateEventKind.ElectionCandidacySubmitted: {
      return {
        title: 'Candidacy Submitted',
        description: 'Someone submits a council candidacy.',
      };
    }
    case SubstrateEventKind.ElectionMemberKicked: {
      return {
        title: 'Member Kicked',
        description: 'A member is kicked at end of term.',
      };
    }
    case SubstrateEventKind.ElectionMemberRenounced: {
      return {
        title: 'Member Renounced',
        description: 'A member renounces their candidacy for the next round.',
      };
    }

    /**
     * Collective Events
     */
    case SubstrateEventKind.CollectiveProposed: {
      return {
        title: 'New Collective Proposal',
        description: 'A new collective proposal is introduced.',
      };
    }
    case SubstrateEventKind.CollectiveVoted: {
      return {
        title: 'Collective Proposal Vote',
        description: 'A collective proposal receives a vote.',
      };
    }
    case SubstrateEventKind.CollectiveApproved: {
      return {
        title: 'Collective Proposal Approved',
        description: 'A collective proposal is approved.',
      };
    }
    case SubstrateEventKind.CollectiveDisapproved: {
      return {
        title: 'Collective Proposal Disapproved',
        description: 'A collective proposal is disapproved.',
      };
    }
    case SubstrateEventKind.CollectiveExecuted: {
      return {
        title: 'Collective Proposal Executed',
        description: 'A collective proposal is executed.',
      };
    }
    case SubstrateEventKind.CollectiveMemberExecuted: {
      return {
        title: 'Collective Member Execution',
        description: 'A collective member directly executes a proposal.',
      };
    }

    /**
     * Signaling Events
     */
    case SubstrateEventKind.SignalingNewProposal: {
      return {
        title: 'New Signaling Proposal',
        description: 'A new signaling proposal is introduced.',
      };
    }
    case SubstrateEventKind.SignalingCommitStarted: {
      return {
        title: 'Signaling Proposal Commit Started',
        description: 'A signaling proposal\'s commit phase begins.',
      };
    }
    case SubstrateEventKind.SignalingVotingStarted: {
      return {
        title: 'Signaling Proposal Voting Started',
        description: 'A signaling proposal\'s voting phase begins.',
      };
    }
    case SubstrateEventKind.SignalingVotingCompleted: {
      return {
        title: 'Signaling Proposal Voting Completed',
        description: 'A signaling proposal is completed.',
      };
    }

    /**
     * TreasuryReward events
     */
    case SubstrateEventKind.TreasuryRewardMinting:
    case SubstrateEventKind.TreasuryRewardMintingV2: {
      return {
        title: 'Treasury Reward Minted',
        description: 'A reward is added to the treasury pot.',
      };
    }

    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = kind;
      throw new Error('unknown event type');
    }
  }
};

export default titlerFunc;
