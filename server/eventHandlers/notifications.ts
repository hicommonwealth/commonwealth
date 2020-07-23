/**
 * Generic handler that transforms events into notifications.
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent } from '@commonwealth/chain-events/dist/src/interfaces';
import { NotificationCategories } from '../../shared/types';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

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
    // log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    if (!dbEvent) {
      log.error('No db event received! Ignoring.');
      return;
    }
    const dbEventType = await dbEvent.getChainEventType();
    if (!dbEventType) {
      log.error('Failed to fetch event type! Ignoring.');
      return;
    }

    // locate subscriptions generate notifications as needed
    const dbNotifications = await this._models.Subscription.emitNotifications(
      this._models,
      NotificationCategories.ChainEvent,
      dbEventType.id,
      { chainEvent: dbEvent, chainEventType: dbEventType },
      { }, // TODO: add webhook data once specced out
      this._wss,
      event.excludeAddresses,
      event.includeAddresses,
    );
    log.info(`Emitted ${dbNotifications.length} notifications.`);
    return dbEvent;
  }
}
