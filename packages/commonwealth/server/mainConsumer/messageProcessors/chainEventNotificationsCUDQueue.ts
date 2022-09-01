import { DB } from '../../database';
import { Logger } from 'typescript-logging';
import { NotificationCategories } from 'common-common/src/types';
import {
  isRmqMsgCreateCENotificationsCUD,
  RascalPublications, TRmqMsgCENotificationsCUD
} from 'common-common/src/rabbitmq/types';
import { RabbitMQController } from "common-common/src/rabbitmq/rabbitMQController";

export type Ithis = {
  models: DB;
  log: Logger;
  rmqController: RabbitMQController;
};

export async function processChainEventNotificationsCUD(
  this: Ithis,
  data: TRmqMsgCENotificationsCUD
) {
  if (!isRmqMsgCreateCENotificationsCUD(data)) {
    console.error("Incorrect message format", data);
    // TODO: rollbar/datadog reporting
    return;
  }

  const chainEvent = data.ChainEvent;
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
      data.event.excludeAddresses,
      data.event.includeAddresses
    );
  } catch (e) {
    this.log.error(
      `Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(
        data.event
      )}\ndbEvent: ${JSON.stringify(data.ChainEvent)}\n`, e
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
        data.event
      )}\ndbEvent: ${JSON.stringify(data.ChainEvent)}\n`, e
    );
  }
}
