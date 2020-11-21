/**
 * Generic handler that stores the event in the database.
 */
import { IEventHandler, CWEvent, IChainEventKind, SubstrateTypes } from '@commonwealth/chain-events';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string,
    private readonly _excludedEvents: IChainEventKind[] = [],
  ) {
    super();
  }

  /**
   * Truncates a preimage with large args into a smaller form, to decrease
   * storage size in the db and size of /bulkEntities fetches.
   */
  private truncateEvent(event: CWEvent, maxLength = 64): CWEvent {
    // only truncate preimages, for now
    if (event.data.kind === SubstrateTypes.EventKind.PreimageNoted && event.data.preimage) {
      event.data.preimage.args = event.data.preimage.args.map((m) => m.length > maxLength
        ? `${m.slice(0, maxLength - 1)}…`
        : m);
    }
    return event;
  }

  /**
   * Handles an event by creating a ChainEvent in the database.
   */
  public async handle(event: CWEvent) {
    event = this.truncateEvent(event);
    log.trace(`Received event: ${JSON.stringify(event, null, 2)}`);
    if (this._excludedEvents.includes(event.data.kind)) {
      log.trace('Skipping event!');
      return;
    }

    // locate event type and add event to database
    const dbEventType = await this._models.ChainEventType.findOne({ where: {
      chain: this._chain,
      event_name: event.data.kind.toString(),
    } });
    if (!dbEventType) {
      log.error(`unknown event type: ${event.data.kind}`);
      return;
    } else {
      log.trace(`found chain event type: ${dbEventType.id}`);
    }

    // create event in db
    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    });
    return dbEvent;
  }
}
