/**
 * Transforms raw edgeware events into the final form for storage
 */
import { IEventHandler } from '../../shared/events/interfaces';
import { SubstrateEvent } from '../../shared/events/edgeware/types';
import { NotificationCategories } from '../../shared/types';

export default class extends IEventHandler<SubstrateEvent> {
  constructor(
    private readonly _models,
    private readonly _wss,
    private readonly _chain: string,
  ) {
    super();
  }

  /**
   * Handles an event by transforming it as needed.
   * @param event the raw event from chain
   * @returns the processed event
   */
  public async handle(event: SubstrateEvent) {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    // locate event type and add event to database
    const dbEventType = await this._models.ChainEventType.findOne({ where: {
      chain: this._chain,
      event_name: event.type.toString(),
    } });
    if (!dbEventType) {
      console.error('unknown event type');
      return;
    } else {
      console.log(`found chain event type: ${dbEventType.id}`);
    }

    const dbEvent = await this._models.ChainEvent.create({
      chain_event_type_id: dbEventType.id,
      block_number: event.blockNumber,
      event_data: event.data,
    });

    console.log(`created db event: ${dbEvent.id}`);

    // locate subscriptions generate notifications as needed
    // TODO: we are replicating all the event data here N times! is there any way
    //   to make this use less data? We could be wasting a lot of space.
    //   Currently, notifications and subscriptions are not changed, but maybe we should
    //   make explicit references?
    const dbNotifications = await this._models.Subscription.emitNotifications(
      this._models,
      NotificationCategories.ChainEvent,
      dbEventType.id,
      {
        created_at: new Date(),
      },
      { }, // TODO: what is webhook data here?
      this._wss,
      dbEvent.id,
    );
    console.log(`Emitted ${dbNotifications.length} notifications.`);
  }
}
