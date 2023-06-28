import type { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import {
  RascalPublications,
  RmqCENotificationCUD,
} from 'common-common/src/rabbitmq/types';
import type { ChainEventNotification } from 'types';
import type { Logger } from 'typescript-logging';
import type { DB } from '../../models';
import type { NotificationInstance } from '../../models/notification';
import emitChainEventNotification from '../../util/emitNotifications/emitChainEventNotifications';

export type Ithis = {
  models: DB;
  log: Logger;
  rmqController: RabbitMQController;
};

export async function processChainEventNotificationsCUD(
  this: Ithis,
  data: RmqCENotificationCUD.RmqMsgType
) {
  RmqCENotificationCUD.checkMsgFormat(data);

  const chainEvent = data.ChainEvent;
  let dbNotification: NotificationInstance;
  try {
    // creates a notification instance if it doesn't exist and then creates NotificationsRead instances for subscribers
    dbNotification = await emitChainEventNotification(
      this.models,
      data.ChainEvent.chain,
      chainEvent,
      data.event.excludeAddresses,
      data.event.includeAddresses
    );
  } catch (e) {
    this.log.error(
      `Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(
        data.event
      )}\ndbEvent: ${JSON.stringify(data.ChainEvent)}\n`,
      e
    );
    return;
  }

  try {
    const formattedEvent = {
      ...dbNotification.toJSON(),
      ChainEvent: chainEvent,
    };

    // send to socket.io for WebSocket notifications
    await this.rmqController.publish(
      <ChainEventNotification>formattedEvent,
      RascalPublications.ChainEventNotifications
    );
    this.log.info('Notification pushed to socket queue');
  } catch (e) {
    this.log.error(
      `Failed to publish notification: ${e.message}\nevent: ${JSON.stringify(
        data.event
      )}\ndbEvent: ${JSON.stringify(data.ChainEvent)}\n`,
      e
    );
  }
}
