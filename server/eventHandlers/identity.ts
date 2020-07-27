import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  SubstrateTypes
} from '@commonwealth/chain-events';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
  ) {
    super();
  }


  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // do nothing if wrong type of event
    if (event.data.kind !== SubstrateTypes.EventKind.IdentitySet
        && event.data.kind !== SubstrateTypes.EventKind.IdentityCleared
        && event.data.kind !== SubstrateTypes.EventKind.IdentityKilled) {
      return dbEvent;
    }

    // TODO: update DB according to event

    return dbEvent;
  }
}
