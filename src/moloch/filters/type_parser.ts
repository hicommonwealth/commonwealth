import { MolochEventKind } from '../types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export default function (
  version: 1 | 2,
  name: string,
): MolochEventKind | null {
  switch (name) {
    case 'SubmitProposal': return MolochEventKind.SubmitProposal;
    case 'SubmitVote': return MolochEventKind.SubmitVote;
    case 'ProcessProposal': return MolochEventKind.ProcessProposal;
    case 'Ragequit': return MolochEventKind.Ragequit;
    case 'Abort': return MolochEventKind.Abort;
    case 'UpdateDelegateKey': return MolochEventKind.UpdateDelegateKey;
    case 'SummonComplete': return MolochEventKind.SummonComplete;
    default: {
      log.warn(`Unknown Moloch event name: ${name}!`);
      return null;
    }
  }
}
