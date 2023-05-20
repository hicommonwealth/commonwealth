import { EventKind } from '../types';
import { addPrefix, factory } from '../../../../logging';
import { SupportedNetwork } from '../../../../interfaces';

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string, origin?: string): EventKind | null {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.ERC721, origin])
  );
  switch (name) {
    // ERC721 Events
    case 'Approval':
      return EventKind.Approval;
    case 'ApprovalForAll':
      return EventKind.ApprovalForAll;
    case 'Transfer':
      return EventKind.Transfer;
    default: {
      log.info(`Unknown event name: ${name}!`);
      return null;
    }
  }
}
