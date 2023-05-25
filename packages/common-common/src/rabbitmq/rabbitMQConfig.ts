import type * as Rascal from 'rascal';
import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalRoutingKeys,
  RascalSubscriptions,
} from './types';

/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 */
export function getRabbitMQConfig(rabbitmq_uri: string): Rascal.BrokerConfig {
  let vhost, purge;

  if (
    rabbitmq_uri.includes('localhost') ||
    rabbitmq_uri.includes('127.0.0.1')
  ) {
    vhost = '/';
    purge = true;
  } else {
    const count = (rabbitmq_uri.match(/\//g) || []).length;
    if (count == 3) {
      // this matches for a production URL
      const res = rabbitmq_uri.split('/');
      vhost = res[res.length - 1];
      purge = false;
    } else if (count == 2) {
      // this matches for a Vultr URL
      vhost = '/';
      purge = true;
    } else {
      throw new Error(
        "Can't create Rascal RabbitMQ Config with an invalid URI!"
      );
    }
  }

  const queueConfig = {
    assert: true,
    purge: purge,
  };

  const queueOptions = {
    'x-dead-letter-exchange': RascalExchanges.DeadLetter,
    'x-dead-letter-routing-key': RascalRoutingKeys.DeadLetter,
  };

  const subscriptionConfig = {
    contentType: 'application/json',
    retry: {
      delay: 1000,
    },
    prefetch: 10,
  };

  const publicationConfig = {
    confirm: true,
    timeout: 10000,
    options: {
      persistent: true,
    },
  };

  const exchangeConfig = {
    assert: true,
    options: {
      durable: true,
    },
  };

  const config = {
    vhosts: {
      [vhost]: {
        connection: rabbitmq_uri,
        exchanges: {
          [RascalExchanges.ChainEvents]: {
            type: 'fanout',
            ...exchangeConfig,
          },
          [RascalExchanges.SnapshotListener]: {
            type: 'fanout',
            ...exchangeConfig,
          },
          [RascalExchanges.DeadLetter]: {
            ...exchangeConfig,
          },
          [RascalExchanges.CUD]: {
            type: 'topic',
            ...exchangeConfig,
          },
          [RascalExchanges.Notifications]: {
            type: 'topic',
            ...exchangeConfig,
          },
        },
        queues: {
          [RascalQueues.ChainEvents]: {
            ...queueConfig,
            options: queueOptions,
          },
          [RascalQueues.ChainEventNotificationsCUDMain]: {
            ...queueConfig,
            options: queueOptions,
          },
          [RascalQueues.ChainEventNotifications]: {
            ...queueConfig,
            options: {
              ...queueOptions,
              'x-message-ttl': 600000,
            },
          },
          [RascalQueues.SnapshotProposalNotifications]: {
            ...queueConfig,
            options: {
              ...queueOptions,
              'x-message-ttl': 600000,
            },
          },
          [RascalQueues.SnapshotListener]: {
            ...queueConfig,
            options: queueOptions,
          },
          [RascalQueues.DeadLetter]: {
            ...queueConfig,
          },
        },
        bindings: {
          [RascalBindings.ChainEvents]: {
            source: RascalExchanges.ChainEvents,
            destination: RascalQueues.ChainEvents,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.ChainEvents,
          },
          [RascalBindings.ChainEventNotificationsCUD]: {
            source: RascalExchanges.CUD,
            destination: RascalQueues.ChainEventNotificationsCUDMain,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.ChainEventNotificationsCUD,
          },
          [RascalBindings.ChainEventNotifications]: {
            source: RascalExchanges.Notifications,
            destination: RascalQueues.ChainEventNotifications,
            destinationType: 'queue',
            bindingKey: RascalBindings.ChainEventNotifications,
          },
          [RascalBindings.SnapshotProposalNotifications]: {
            source: RascalExchanges.Notifications,
            destination: RascalQueues.SnapshotProposalNotifications,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.SnapshotProposalNotifications,
          },
          [RascalBindings.SnapshotListener]: {
            source: RascalExchanges.SnapshotListener,
            destination: RascalQueues.SnapshotListener,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.SnapshotListener,
          },
          [RascalBindings.DeadLetter]: {
            source: RascalExchanges.DeadLetter,
            destination: RascalQueues.DeadLetter,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.DeadLetter,
          },
        },
        publications: {
          [RascalPublications.ChainEvents]: {
            exchange: RascalExchanges.ChainEvents,
            routingKey: RascalRoutingKeys.ChainEvents,
            ...publicationConfig,
          },

          [RascalPublications.ChainEventNotificationsCUDMain]: {
            exchange: RascalExchanges.CUD,
            routingKey: RascalRoutingKeys.ChainEventNotificationsCUD,
            ...publicationConfig,
          },
          [RascalPublications.ChainEventNotifications]: {
            exchange: RascalExchanges.Notifications,
            routingKey: RascalRoutingKeys.ChainEventNotifications,
            ...publicationConfig,
          },
          [RascalPublications.SnapshotProposalNotifications]: {
            exchange: RascalExchanges.Notifications,
            routingKey: RascalRoutingKeys.SnapshotProposalNotifications,
            ...publicationConfig,
          },
          [RascalPublications.SnapshotListener]: {
            exchange: RascalExchanges.SnapshotListener,
            routingKey: RascalRoutingKeys.SnapshotListener,
            ...publicationConfig,
          },
        },
        subscriptions: {
          [RascalSubscriptions.ChainEvents]: {
            queue: RascalQueues.ChainEvents,
            ...subscriptionConfig,
          },
          [RascalSubscriptions.ChainEventNotificationsCUDMain]: {
            queue: RascalQueues.ChainEventNotificationsCUDMain,
            ...subscriptionConfig,
          },
          [RascalSubscriptions.ChainEventNotifications]: {
            queue: RascalQueues.ChainEventNotifications,
            ...subscriptionConfig,
          },
          [RascalSubscriptions.SnapshotProposalNotifications]: {
            queue: RascalQueues.SnapshotProposalNotifications,
            ...subscriptionConfig,
          },
          [RascalSubscriptions.SnapshotListener]: {
            queue: RascalQueues.SnapshotListener,
            ...subscriptionConfig,
          },
        },
      },
    },
  };

  // the above configuration is correct but Rascal has some type issues
  return <Rascal.BrokerConfig>config;
}
