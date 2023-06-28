import type { RabbitMQController } from 'common-common/src/rabbitmq/rabbitMQController';
import {
  RascalPublications,
  RmqCENotificationCUD,
} from 'common-common/src/rabbitmq/types';
import { NotificationCategories } from 'common-common/src/types';
import type { ChainEventNotification } from 'types';
import type { Logger } from 'typescript-logging';
import type { DB } from '../../models';
import type { NotificationInstance } from '../../models/notification';
import emitNotifications from '../../util/emitNotifications/emitNotifications';

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
    dbNotification = await emitNotifications(
      this.models,
      NotificationCategories.ChainEvent,
      data.ChainEvent.chain,
      chainEvent,
      {
        chainEvent,
        chain: chainEvent.chain,
      },
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
