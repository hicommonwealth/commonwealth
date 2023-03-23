import type { IEventTitle, TitlerFilter } from '../../../interfaces';
import { SupportedNetwork } from '../../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (
  kind: EventKind,
  chain?: string
): IEventTitle => {
  switch (kind) {
    case EventKind.BalanceTransfer: {
      return {
        title: 'Balance Transferred',
        description: 'A balance transfer is performed.',
      };
    }
    /**
     * ImOnline Events
     */
    case EventKind.HeartbeatReceived: {
      return {
        title: 'Heartbeat Received',
        description: 'A new heartbeat is received .',
      };
    }
    case EventKind.SomeOffline: {
      return {
        title: 'Some validators were offline ',
        description:
          'At the end of the session, at least one validator was found to be offline.',
      };
    }
    case EventKind.AllGood: {
      return {
        title: 'All validators were online ',
        description: 'At the end of the session, no offence was committed.',
      };
    }

    /**
     * Session Events
     */
    case EventKind.NewSession: {
      return {
        title: 'New Session',
        description: 'A new session begins.',
      };
    }

    /**
     * Offences Events
     */
    case EventKind.Offence: {
      return {
        title: 'Offence Reported',
        description: 'An offence of given type is reported at timeslot.',
      };
    }

    /**
     * Staking Events
     */
    case EventKind.Slash: {
      return {
        title: 'Validator Slash',
        description: 'Your validator is slashed.',
      };
    }
    case EventKind.Reward: {
      return {
        title: 'Validator Reward',
        description: 'Your validator is rewarded.',
      };
    }
    case EventKind.Bonded: {
      return {
        title: 'Stash Bonded',
        description: 'Your controller account bonds to a stash account.',
      };
    }
    case EventKind.Unbonded: {
      return {
        title: 'Stash Unbonded',
        description: 'Your controller account unbonds from a stash account.',
      };
    }
    case EventKind.StakingElection: {
      return {
        title: 'Staking Election',
        description: 'A new validator set is elected.',
      };
    }

    /**
     * Democracy Events
     */
    case EventKind.VoteDelegated: {
      return {
        title: 'Vote Delegated',
        description: 'You receive a voting delegation.',
      };
    }
    case EventKind.DemocracyProposed: {
      return {
        title: 'Democracy Proposed',
        description: 'A new community democracy proposal is introduced.',
      };
    }
    case EventKind.DemocracySeconded: {
      return {
        title: 'Democracy Proposal Seconded',
        description: 'A democracy proposal is seconded.',
      };
    }
    case EventKind.DemocracyTabled: {
      return {
        title: 'Democracy Proposal Tabled',
        description: 'A public democracy proposal is tabled to a referendum.',
      };
    }
    case EventKind.DemocracyStarted: {
      return {
        title: 'Referendum Started',
        description: 'A new democracy referendum started voting.',
      };
    }
    case EventKind.DemocracyVoted: {
      return {
        title: 'Democracy Vote Received',
        description: 'A democracy vote was received.',
      };
    }
    case EventKind.DemocracyPassed: {
      return {
        title: 'Referendum Passed',
        description: 'A democracy referendum finished voting and passed.',
      };
    }
    case EventKind.DemocracyNotPassed: {
      return {
        title: 'Referendum Failed',
        description: 'A democracy referendum finished voting and failed.',
      };
    }
    case EventKind.DemocracyCancelled: {
      return {
        title: 'Referendum Cancelled',
        description: 'A democracy referendum is cancelled.',
      };
    }
    case EventKind.DemocracyExecuted: {
      return {
        title: 'Referendum Executed',
        description: 'A passed democracy referendum is executed on chain.',
      };
    }

    /**
     * Preimage Events
     */
    case EventKind.PreimageNoted: {
      return {
        title: 'Preimage Noted',
        description: 'A preimage is noted for a democracy referendum.',
      };
    }
    case EventKind.PreimageUsed: {
      return {
        title: 'Preimage Used',
        description: "A democracy referendum's execution uses a preimage.",
      };
    }
    case EventKind.PreimageInvalid: {
      return {
        title: 'Preimage Invalid',
        description:
          "A democracy referendum's execution was attempted but the preimage is invalid.",
      };
    }
    case EventKind.PreimageMissing: {
      return {
        title: 'Preimage Missing',
        description:
          "A democracy referendum's execution was attempted but the preimage is missing.",
      };
    }
    case EventKind.PreimageReaped: {
      return {
        title: 'Preimage Reaped',
        description:
          'A registered preimage is removed and the deposit is collected.',
      };
    }

    /**
     * Treasury Events
     */
    case EventKind.TreasuryProposed: {
      return {
        title: 'Treasury Proposed',
        description: 'A treasury spend is proposed.',
      };
    }
    case EventKind.TreasuryAwarded: {
      return {
        title: 'Treasury Awarded',
        description: 'A treasury spend is awarded.',
      };
    }
    case EventKind.TreasuryRejected: {
      return {
        title: 'Treasury Rejected',
        description: 'A treasury spend is rejected.',
      };
    }
    /**
     * Elections Events
     */
    case EventKind.ElectionNewTerm: {
      return {
        title: 'New Election Term',
        description: 'A new election term begins with new members.',
      };
    }
    case EventKind.ElectionEmptyTerm: {
      return {
        title: 'Empty Election Term',
        description: 'A new election term begins with no member changes.',
      };
    }
    case EventKind.ElectionCandidacySubmitted: {
      return {
        title: 'Candidacy Submitted',
        description: 'Someone submits a council candidacy.',
      };
    }
    case EventKind.ElectionMemberKicked: {
      return {
        title: 'Member Kicked',
        description: 'A member is kicked at end of term.',
      };
    }
    case EventKind.ElectionMemberRenounced: {
      return {
        title: 'Member Renounced',
        description: 'A member renounces their candidacy for the next round.',
      };
    }

    /**
     * TreasuryReward events
     */
    case EventKind.TreasuryRewardMinting:
    case EventKind.TreasuryRewardMintingV2: {
      return {
        title: 'Treasury Reward Minted',
        description: 'A reward is added to the treasury pot.',
      };
    }

    /**
     * Tip Events
     */
    case EventKind.NewTip: {
      return {
        title: 'New Tip Suggested',
        description: 'A new tip is opened.',
      };
    }
    case EventKind.TipVoted: {
      return {
        title: 'Tip Voted',
        description: 'A tip is voted on.',
      };
    }
    case EventKind.TipClosing: {
      return {
        title: 'Tip Closing',
        description: 'A tip begins closing.',
      };
    }
    case EventKind.TipClosed: {
      return {
        title: 'Tip Closed',
        description: 'A tip is closed and paid out.',
      };
    }
    case EventKind.TipRetracted: {
      return {
        title: 'Tip Retracted',
        description: 'A tip is retracted.',
      };
    }
    case EventKind.TipSlashed: {
      return {
        title: 'Tip Slashed',
        description: 'A tip is slashed.',
      };
    }

    /**
     * Identity events
     */
    case EventKind.IdentitySet: {
      return {
        title: 'Identity Set',
        description: 'A user sets an identity.',
      };
    }
    case EventKind.IdentityCleared: {
      return {
        title: 'Identity Cleared',
        description: 'A user clears an identity.',
      };
    }
    case EventKind.IdentityKilled: {
      return {
        title: 'Identity Killed',
        description: "A user's identity is rejected.",
      };
    }

    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = kind;
      throw new Error(
        `[${SupportedNetwork.Substrate}${
          chain ? `::${chain}` : ''
        }]: unknown event type`
      );
    }
  }
};
