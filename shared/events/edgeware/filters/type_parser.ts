import { Event } from '@polkadot/types/interfaces';
import { SubstrateEventKind } from '../types';

export default function (event: Event): SubstrateEventKind | null {
  switch (event.section) {
    case 'staking':
      switch (event.method) {
        case 'Slash': return 'slash';
        case 'Reward': return 'reward';
        case 'Bonded': return 'bonded';
        case 'Unbonded': return 'unbonded';
        default: return null;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return 'democracy-proposed';
        case 'Started': return 'democracy-started';
        case 'Passed': return 'democracy-passed';
        case 'NotPassed': return 'democracy-not-passed';
        case 'Cancelled': return 'democracy-cancelled';
        case 'Executed': return 'democracy-executed';
        case 'Delegated': return 'vote-delegated';
        default: return null;
      }
    case 'treasury':
      switch (event.method) {
        case 'Proposed': return 'treasury-proposed';
        case 'Awarded': return 'treasury-awarded';
        case 'Rejected': return 'treasury-rejected';
        default: return null;
      }
    default:
      return null;
  }
}
