import { EventKind } from '../types';
import { addPrefix, factory } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string, chain?: string): EventKind | null {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Commonwealth, chain])
  );
  switch (name) {
    case 'ProjectCreated':
      return EventKind.ProjectCreated;
    case 'Back':
      return EventKind.ProjectBacked;
    case 'Curate':
      return EventKind.ProjectCurated;
    case 'Succeeded':
      return EventKind.ProjectSucceeded;
    case 'Failed':
      return EventKind.ProjectFailed;
    case 'Withdraw':
      return EventKind.ProjectWithdraw;
    default: {
      log.warn(`Unknown event name: ${name}`);
      return null;
    }
  }
}
