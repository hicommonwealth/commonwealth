/**
 * Transforms raw edgeware events into notifications, and stores them in the db as ChainEvents.
 */
import { IEventHandler, CWEvent } from '../../../shared/events/interfaces';
import { NotificationCategories } from '../../../shared/types';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
   * Handles an event by creating a ChainEvent in the database, and emitting
   * notifications as needed.
   */
  public async handle(event: CWEvent) {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    // locate event type and add event to database
    const dbEventType = await this._models.ChainEventType.findOne({ where: {
      chain: this._chain,
      event_name: event.data.kind.toString(),
    } });
    if (!dbEventType) {
      console.error(`unknown event type: ${event.data.kind}`);
      return;
    } else {
      console.log(`found chain event type: ${dbEventType.id}`);
    }

    // create event in db
    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    });

    console.log(`created db event: ${dbEvent.id}`);

    // locate subscriptions generate notifications as needed
    const dbNotifications = await this._models.Subscription.emitNotifications(
      this._models,
      NotificationCategories.ChainEvent,
      dbEventType.id,
      {
        created_at: new Date(),
      },
      { }, // TODO: add webhook data once specced out
      this._wss,
      event.excludeAddresses,
      event.includeAddresses,
      dbEvent.id,
    );
    console.log(`Emitted ${dbNotifications.length} notifications.`);
    return dbEvent;
  }
}
