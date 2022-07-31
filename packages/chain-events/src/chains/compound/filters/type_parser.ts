import { EventKind } from '../types';
import { addPrefix, factory } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string, chain?: string): EventKind | null {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Compound, chain])
  );
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
      log.warn(`Unknown event name: ${name}!`);
      return null;
    }
  }
}
