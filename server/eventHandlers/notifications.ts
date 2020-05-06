/**
 * Generic handler that transforms events into notifications.
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent } from '../../shared/events/interfaces';
import { NotificationCategories } from '../../shared/types';

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss?: WebSocket.Server,
  ) {
    super();
  }

  /**
   * Handles an event by emitting notifications as needed.
   */
  public async handle(event: CWEvent, dbEvent) {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    if (!dbEvent) {
      console.error('No db event received! Ignoring.');
      return;
    }
    const dbEventType = await dbEvent.getChainEventType();
    if (!dbEventType) {
      console.error('Failed to fetch event type! Ignoring.');
      return;
    }

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
