import { EventKind } from '../types';
import { addPrefix, factory } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(typeUrl: string, chain?: string): EventKind | null {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Cosmos, chain])
  );
  switch (typeUrl) {
    case '/cosmos.gov.v1beta1.MsgSubmitProposal':
      return EventKind.SubmitProposal;
    /* JAKE 12/16: voting disabled for time being
    case '/cosmos.gov.v1beta1.MsgVote':
      return EventKind.Vote;
    case '/cosmos.gov.v1beta1.MsgDeposit':
      return EventKind.Deposit;
    */
    default: {
      log.trace(`Unknown event typeUrl: ${typeUrl}!`);
      return null;
    }
  }
}
