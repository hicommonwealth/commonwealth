import { EventKind } from '../types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(
  version: 1 | 2,
  name: string,
): EventKind | null {
  switch (name) {
    case 'SubmitProposal': return EventKind.SubmitProposal;
    case 'SubmitVote': return EventKind.SubmitVote;
    case 'ProcessProposal': return EventKind.ProcessProposal;
    case 'Ragequit': return EventKind.Ragequit;
    case 'Abort': return EventKind.Abort;
    case 'UpdateDelegateKey': return EventKind.UpdateDelegateKey;
    case 'SummonComplete': return EventKind.SummonComplete;
    default: {
      log.warn(`Unknown Moloch event name: ${name}!`);
      return null;
    }
  }
}
