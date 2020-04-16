import { Event } from '@polkadot/types/interfaces';
import { SubstrateEventType } from '../types';

export function parseEventType(event: Event): SubstrateEventType {
  switch (event.section) {
    case 'staking':
      switch (event.method) {
        case 'Slash': return SubstrateEventType.Slash;
        case 'Reward': return SubstrateEventType.Reward;
        default: return SubstrateEventType.Unknown;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return SubstrateEventType.DemocracyProposed;
        case 'Started': return SubstrateEventType.DemocracyStarted;
        case 'Passed': return SubstrateEventType.DemocracyPassed;
        case 'NotPassed': return SubstrateEventType.DemocracyNotPassed;
        case 'Cancelled': return SubstrateEventType.DemocracyCancelled;
        default: return SubstrateEventType.Unknown;
      }
    default:
      return SubstrateEventType.Unknown;
  }
}
