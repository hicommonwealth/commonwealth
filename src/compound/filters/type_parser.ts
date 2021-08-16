import { EventKind } from '../types';
import { factory, formatFilename } from '../../logging';

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
    case 'VoteCast':
      return EventKind.VoteCast;
    default: {
      log.warn(`Unknown Compound event name: ${name}!`);
      return null;
    }
  }
}
