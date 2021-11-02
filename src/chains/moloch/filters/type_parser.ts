import { EventKind } from '../types';
import { addPrefix, factory } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(
  version: 1 | 2,
  name: string,
  chain?: string
): EventKind | null {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Moloch, chain])
  );
  switch (name) {
    case 'SubmitProposal':
      return EventKind.SubmitProposal;
    case 'SubmitVote':
      return EventKind.SubmitVote;
    case 'ProcessProposal':
      return EventKind.ProcessProposal;
    case 'Ragequit':
      return EventKind.Ragequit;
    case 'Abort':
      return EventKind.Abort;
    case 'UpdateDelegateKey':
      return EventKind.UpdateDelegateKey;
    case 'SummonComplete':
      return EventKind.SummonComplete;
    default: {
      log.warn(`Unknown event name: ${name}!`);
      return null;
    }
  }
}
