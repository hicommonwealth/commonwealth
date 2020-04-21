import { SubstrateEventKind } from '../types';
import { IEventTitle, TitlerFilter } from '../../interfaces';

const titlerFunc: TitlerFilter = (kind: SubstrateEventKind): IEventTitle => {
  switch (kind) {
    case 'slash': {
      return {
        title: 'Validator Slash',
        description: 'Your validator is slashed.',
      };
    }
    case 'reward': {
      return {
        title: 'Validator Reward',
        description: 'Your validator is rewarded.',
      };
    }
    case 'bonded': {
      return {
        title: 'Stash Bonded',
        description: 'Your controller account bonds to a stash account.',
      };
    }
    case 'unbonded': {
      return {
        title: 'Stash Unbonded',
        description: 'Your controller account unbonds from a stash account.',
      };
    }
    case 'vote-delegated': {
      return {
        title: 'Vote Delegated',
        description: 'You receive a voting delegation.',
      };
    }
    case 'democracy-proposed': {
      return {
        title: 'Democracy Proposed',
        description: 'A new community democracy proposal is introduced.',
      };
    }
    case 'democracy-started': {
      return {
        title: 'Referendum Started',
        description: 'A new democracy referendum started voting.',
      };
    }
    case 'democracy-passed': {
      return {
        title: 'Referendum Passed',
        description: 'A democracy referendum finished voting and passed.',
      };
    }
    case 'democracy-not-passed': {
      return {
        title: 'Referendum Failed',
        description: 'A democracy referendum finished voting and failed.',
      };
    }
    case 'democracy-cancelled': {
      return {
        title: 'Referendum Cancelled',
        description: 'A democracy referendum is cancelled.',
      };
    }
    case 'democracy-executed': {
      return {
        title: 'Referendum Executed',
        description: 'A passed democracy referendum is executed on chain.',
      };
    }
    case 'treasury-proposed': {
      return {
        title: 'Treasury Proposed',
        description: 'A treasury spend is proposed.',
      };
    }
    case 'treasury-awarded': {
      return {
        title: 'Treasury Awarded',
        description: 'A treasury spend is awarded.',
      };
    }
    case 'treasury-rejected': {
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
