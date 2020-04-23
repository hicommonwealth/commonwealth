import { Event } from '@polkadot/types/interfaces';
import { SubstrateEventKind } from '../types';

/**
 * This is the Type Parser function, which takes a raw Substrate chain Event
 * and determines which of our local event kinds it belongs to.
 */
export default function (event: Event): SubstrateEventKind | null {
  // TODO: we can unify this with the enricher file: parse out the kind, and then
  //   marshall the rest of the types in the same place. But for now, we can leave as-is.
  switch (event.section) {
    case 'staking':
      switch (event.method) {
        case 'Slash': return SubstrateEventKind.Slash;
        case 'Reward': return SubstrateEventKind.Reward;
        case 'Bonded': return SubstrateEventKind.Bonded;
        case 'Unbonded': return SubstrateEventKind.Unbonded;
        default: return null;
      }
    case 'democracy':
      switch (event.method) {
        case 'Proposed': return SubstrateEventKind.DemocracyProposed;
        case 'Started': return SubstrateEventKind.DemocracyStarted;
        case 'Passed': return SubstrateEventKind.DemocracyPassed;
        case 'NotPassed': return SubstrateEventKind.DemocracyNotPassed;
        case 'Cancelled': return SubstrateEventKind.DemocracyCancelled;
        case 'Executed': return SubstrateEventKind.DemocracyExecuted;
        case 'Delegated': return SubstrateEventKind.VoteDelegated;
        default: return null;
      }
    case 'treasury':
      switch (event.method) {
        case 'Proposed': return SubstrateEventKind.TreasuryProposed;
        case 'Awarded': return SubstrateEventKind.TreasuryAwarded;
        case 'Rejected': return SubstrateEventKind.TreasuryRejected;
        default: return null;
      }
    default:
      return null;
  }
}
