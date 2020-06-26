/**
 * Generic handler that stores the event in the database.
 */
import { IEventHandler, CWEvent } from 'commonwealth-chain-events/dist/src/interfaces';

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
   * Handles an event by creating a ChainEvent in the database.
   */
  public async handle(event: CWEvent) {
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
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

    // check for duplicate event
    const exists = await this._models.ChainEvent.findOne({
      where: {
        chain_event_type_id: dbEventType.id,
        event_data: event.data,
      }
    });
    if (exists) {
      log.error(`Received duplicate event: ${JSON.stringify(event)}`);
      return;
    }

    // create event in db
    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data
    });

    return dbEvent;
  }
}
