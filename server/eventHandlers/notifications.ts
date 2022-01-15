/**
 * Generic handler that transforms events into notifications.
 */
import WebSocket from 'ws';
import {
  IEventHandler,
  CWEvent,
  IChainEventKind,
} from '@commonwealth/chain-events';
import { NotificationCategories } from '../../shared/types';

import { addPrefix, factory, formatFilename } from '../../shared/logging';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  public readonly name = 'Notification';

  constructor(
    private readonly _models,
    private readonly _wss?: WebSocket.Server,
    private readonly _excludedEvents: IChainEventKind[] = [],
    private readonly _rabbitMqController?: RabbitMQController
  ) {
    super();
  }

  /**
   * Handles an event by emitting notifications as needed.
   */
  public async handle(event: CWEvent, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));

    if (!dbEvent) {
      log.trace(`No db event received! Ignoring.`);
      return;
    }
    if (this._excludedEvents.includes(event.data.kind)) {
      log.trace(`Skipping event!`);
      return dbEvent;
    }
    try {
      const dbEventType = await dbEvent.getChainEventType();
      if (!dbEventType) {
        log.error(`Failed to fetch event type! Ignoring.`);
        return;
      }

      // creates a notification instance if it doesn't exist and then creates NotificationsRead instances for subscribers
      const dbNotification = await this._models.Subscription.emitNotifications(
        this._models,
        NotificationCategories.ChainEvent,
        dbEventType.id,
        { chainEvent: dbEvent, chainEventType: dbEventType, chain_id: event.chain },
        { chainEvent: dbEvent, chainEventType: dbEventType, chain: event.chain }, // TODO: add webhook data once specced out
        this._wss,
        event.excludeAddresses,
        event.includeAddresses
      );

      // construct notification with all the necessary data from the DB (without having to re-query using joins)
      const formattedEvent = dbNotification.toJSON()
      formattedEvent.ChainEvent = dbEvent.toJSON()
      formattedEvent.ChainEvent.ChainEventType = dbEventType.toJSON()

      // publish notification to the appropriate RabbitMQ queue (sends to socket.io servers to send to clients)
      await this._rabbitMqController.publish(formattedEvent, 'ChainEventsNotificationsPublication')

      return dbEvent;
    } catch (e) {
      if (e.errors && e.errors.length > 0) {
        const errors = e.errors.map(x => x.message)
        log.error(`Failed to generate notification (${e.message}): ${errors}!\nevent: ${JSON.stringify(event)}\ndbEvent: ${JSON.stringify(dbEvent)}\n`);
      } else {
        log.error(`Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(event)}\ndbEvent: ${JSON.stringify(dbEvent)}\n`);
      }
      return dbEvent;
    }
  }
}
