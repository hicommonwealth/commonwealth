/**
 * Generic handler that stores the event in the database.
 */
import { IEventHandler, CWEvent } from '../../shared/events/interfaces';

import { factory, formatFilename } from '../util/logging';
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

    // create event in db
    const [ dbEvent, created ] = await this._models.ChainEvent.findOrCreate({
      where: {
        chain_event_type_id: dbEventType.id,
        block_number: event.blockNumber,
      },
      defaults: { event_data: event.data }
    });

    if (!created) {
      log.error('Received duplicate event!');
      return;
    }

    return dbEvent;
  }
}
