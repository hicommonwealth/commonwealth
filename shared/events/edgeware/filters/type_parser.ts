import { Event } from '@polkadot/types/interfaces';
import { SubstrateEventKind } from '../types';

export default function (event: Event): SubstrateEventKind | null {
  switch (event.section) {
    case 'staking':
      switch (event.method) {
        case 'Slash': return 'slash';
        case 'Reward': return 'reward';
        default: return null;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return 'democracy-proposed';
        case 'Started': return 'democracy-started';
        case 'Passed': return 'democracy-passed';
        case 'NotPassed': return 'democracy-not-passed';
        case 'Cancelled': return 'democracy-cancelled';
        default: return null;
      }
    default:
      return null;
  }
}
