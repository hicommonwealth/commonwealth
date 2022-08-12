import { DB } from '../../database';
import { Logger } from 'typescript-logging';
import { CWEvent, IChainEventKind } from 'chain-events/src';
import { ChainEventNotification } from '../../../shared/types';
import { NotificationCategories } from 'common-common/src/types';
import { ChainEventAttributes } from 'chain-events/services/database/models/chain_event';
import { RascalPublications } from 'common-common/src/rabbitmq/types';

export type Ithis = {
  models: DB;
  log: Logger;
  publish: (data: any, publisherName: any) => Promise<any>
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
  try {
    // creates a notification instance if it doesn't exist and then creates NotificationsRead instances for subscribers
    const dbNotification = await this.models.Subscription.emitNotifications(
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

    const formattedEvent = {
      ...dbNotification.toJSON(),
      ChainEvent: chainEvent,
    };
    formattedEvent.ChainEvent = chainEvent;

    // send to socket.io for WebSocket notifications
    await this.publish(formattedEvent, RascalPublications.ChainEventNotifications);
  } catch (e) {
    if (e.errors && e.errors.length > 0) {
      const errors = e.errors.map((x) => x.message);
      this.log.error(
        `Failed to generate notification (${
          e.message
        }): ${errors}!\nevent: ${JSON.stringify(
          chainEventData.event
        )}\ndbEvent: ${JSON.stringify(chainEventData.ChainEvent)}\n`
      );
    } else {
      this.log.error(
        `Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(
          chainEventData.event
        )}\ndbEvent: ${JSON.stringify(chainEventData.ChainEvent)}\n`
      );
    }
  }
}
