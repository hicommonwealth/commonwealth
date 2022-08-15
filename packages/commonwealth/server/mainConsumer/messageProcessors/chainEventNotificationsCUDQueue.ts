import { DB } from '../../database';
import { Logger } from 'typescript-logging';
import { CWEvent } from 'chain-events/src';
import { NotificationCategories } from 'common-common/src/types';
import { ChainEventAttributes } from 'chain-events/services/database/models/chain_event';
import { RascalPublications } from 'common-common/src/rabbitmq/types';
import { RabbitMQController } from "common-common/src/rabbitmq/rabbitMQController";

export type Ithis = {
  models: DB;
  log: Logger;
  rmqController: RabbitMQController;
};

export async function processChainEventNotificationsCUD(
  this: Ithis,
  chainEventData: {
    ChainEvent: ChainEventAttributes;
    event: CWEvent;
    cud: 'create';
  }
) {
  const chainEvent = chainEventData.ChainEvent;
  let dbNotification;
  try {
    // creates a notification instance if it doesn't exist and then creates NotificationsRead instances for subscribers
    dbNotification = await this.models.Subscription.emitNotifications(
      this.models,
      NotificationCategories.ChainEvent,
      chainEvent.ChainEventType.id,
      {
        chainEvent,
        chainEventType: chainEvent.ChainEventType,
        chain_id: chainEvent.ChainEventType.chain,
      },
      {
        chainEvent,
        chainEventType: chainEvent.ChainEventType,
        chain: chainEvent.ChainEventType.chain,
      },
      chainEventData.event.excludeAddresses,
      chainEventData.event.includeAddresses
    );
  } catch (e) {
    this.log.error(
      `Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(
        chainEventData.event
      )}\ndbEvent: ${JSON.stringify(chainEventData.ChainEvent)}\n`, e
    );
    return;
  }

  try {
    const formattedEvent = {
      ...dbNotification.toJSON(),
      ChainEvent: chainEvent,
    };
    formattedEvent.ChainEvent = chainEvent;

    // send to socket.io for WebSocket notifications
    await this.rmqController.publish(
      formattedEvent,
      RascalPublications.ChainEventNotifications
    );
    this.log.info('Notification pushed to socket queue');
  } catch (e) {
    this.log.error(
      `Failed to publish notification: ${e.message}\nevent: ${JSON.stringify(
        chainEventData.event
      )}\ndbEvent: ${JSON.stringify(chainEventData.ChainEvent)}\n`, e
    );
  }
}
