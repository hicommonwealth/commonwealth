import { EventKind } from '../types';
import { factory, formatFilename } from '../../../logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string): EventKind | null {
  switch (name) {
    // ERC20 Events
    case 'Approval':
      return EventKind.Approval;
    case 'Transfer':
      return EventKind.Transfer;
    default: {
      log.warn(`Unknown Erc20 event name: ${name}!`);
      return null;
    }
  }
}
