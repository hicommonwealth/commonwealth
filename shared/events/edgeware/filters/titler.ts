import { SubstrateEventKind } from '../types';
import { IEventTitle, TitlerFilter } from '../../interfaces';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const titlerFunc: TitlerFilter = (kind: SubstrateEventKind): IEventTitle => {
  switch (kind) {
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
    default: {
      throw new Error('unknown event type');
    }
  }
};

export default titlerFunc;
