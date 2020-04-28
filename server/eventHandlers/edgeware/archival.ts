/**
 * Transforms raw edgeware events into the final form for storage
 */
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { SubstrateEventKind } from '../../../shared/events/edgeware/types';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
   * Handles an existing ChainEvent by connecting it with an entity, and creating
   * threads as needed.
   */
  public async handle(event: CWEvent, dbEvent) {
    if (!dbEvent) {
      console.error('no db event found!');
      return;
    }

    /* We expect to see 3 types of events:
     * 1. Entity creation events, "new proposal", e.g.
     * 2. Entity modification events, state changes and updates
     * 3. Events unrelated to entities (at least, ones we care about), like staking events
     *
     * This function should determine, using the event's type, what action to take, based
     * on whether it is a creation, modification, or unrelated event.
     */
    switch (event.data.kind) {
      default: {
        console.log(`no archival action needed for event of kind ${event.data.kind.toString()}`);
        return dbEvent;
      }
    }
  }
}
