import { EventKind } from '../types';
import { factory, formatFilename } from '../../../logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string): EventKind | null {
  switch (name) {
    case 'ProposalExecuted':
      return EventKind.ProposalExecuted;
    case 'ProposalCreated':
      return EventKind.ProposalCreated;
    case 'ProposalCanceled':
      return EventKind.ProposalCanceled;
    case 'ProposalQueued':
      return EventKind.ProposalQueued;
    case 'VoteEmitted':
      return EventKind.VoteEmitted;
    case 'DelegateChanged':
      return EventKind.DelegateChanged;
    case 'DelegatedPowerChanged':
      return EventKind.DelegatedPowerChanged;
    case 'Transfer':
      return EventKind.Transfer;
    case 'Approval':
      return EventKind.Approval;
    default: {
      log.warn(`Unknown Aave event name: ${name}!`);
      return null;
    }
  }
}
