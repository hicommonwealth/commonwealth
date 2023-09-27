import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalRoutingKeys,
  RascalSubscriptions,
} from '../types';
import {
  BindingConfig,
  BrokerConfig,
  ConnectionConfig,
  ExchangeConfig,
  PublicationConfig,
  QueueConfig,
  SubscriptionConfig,
} from 'rascal';

type RascalExchangesType = {
  [K in RascalExchanges]: string;
};
type OmittedRascalExchanges = Omit<
  RascalExchangesType,
  RascalExchanges.DeadLetter
>;
type allExchangesType = Record<keyof OmittedRascalExchanges, ExchangeConfig>;

type RascalQueuesType = {
  [K in RascalQueues]: string;
};
type OmittedRascalQueue = Omit<RascalQueuesType, RascalQueues.DeadLetter>;
type allQueuesType = Record<keyof OmittedRascalQueue, QueueConfig>;

type RascalBindingsType = {
  [K in RascalBindings]: string;
};
type OmittedRascalBindings = Omit<
  RascalBindingsType,
  RascalBindings.DeadLetter
>;
type allBindingsType = Record<keyof OmittedRascalBindings, BindingConfig>;

type allPublicationsType = Record<RascalPublications, PublicationConfig>;
type allSubscriptionsType = Record<RascalSubscriptions, SubscriptionConfig>;

type getAllRascalConfigsType = {
  baseConfig: BrokerConfig;
  allExchanges: allExchangesType;
  allQueues: allQueuesType;
  allBindings: allBindingsType;
  allPublications: allPublicationsType;
  allSubscriptions: allSubscriptionsType;
};

export function getAllRascalConfigs(
  rabbitmq_uri: string,
  vhost: string,
  purge: boolean
): getAllRascalConfigsType {
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

  const allExchanges: Record<keyof OmittedRascalExchanges, ExchangeConfig> = {
    [RascalExchanges.ChainEvents]: {
      type: 'fanout',
      ...exchangeConfig,
    },
    [RascalExchanges.SnapshotListener]: {
      type: 'fanout',
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
    [RascalExchanges.Discobot]: {
      type: 'fanout',
      ...exchangeConfig,
    },
    [RascalExchanges.FarcasterBot]: {
      type: 'fanout',
      ...exchangeConfig,
    },
  };

  const allQueues: Record<keyof OmittedRascalQueue, QueueConfig> = {
    [RascalQueues.ChainEvents]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.ChainEventNotificationsCUDMain]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.ChainEventNotifications]: {
      ...queueConfig,
      options: {
        arguments: {
          ...queueOptions,
          'x-message-ttl': 600000,
        },
      },
    },
    [RascalQueues.SnapshotListener]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.DiscordListener]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.FarcasterListener]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
  };

  const allBindings: Record<keyof OmittedRascalBindings, BindingConfig> = {
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
    [RascalBindings.SnapshotListener]: {
      source: RascalExchanges.SnapshotListener,
      destination: RascalQueues.SnapshotListener,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.SnapshotListener,
    },
    [RascalBindings.DiscordListener]: {
      source: RascalExchanges.Discobot,
      destination: RascalQueues.DiscordListener,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.DiscordListener,
    },
    [RascalBindings.FarcasterListener]: {
      source: RascalExchanges.FarcasterBot,
      destination: RascalQueues.FarcasterListener,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.FarcasterListener,
    },
  };

  const allPublications: Record<RascalPublications, PublicationConfig> = {
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
    [RascalPublications.SnapshotListener]: {
      exchange: RascalExchanges.SnapshotListener,
      routingKey: RascalRoutingKeys.SnapshotListener,
      ...publicationConfig,
    },
    [RascalPublications.DiscordListener]: {
      exchange: RascalExchanges.Discobot,
      routingKey: RascalRoutingKeys.DiscordListener,
      ...publicationConfig,
    },
    [RascalPublications.FarcasterListener]: {
      exchange: RascalExchanges.FarcasterBot,
      routingKey: RascalRoutingKeys.FarcasterListener,
      ...publicationConfig,
    },
  };

  const allSubscriptions: Record<RascalSubscriptions, SubscriptionConfig> = {
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
    [RascalSubscriptions.SnapshotListener]: {
      queue: RascalQueues.SnapshotListener,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.DiscordListener]: {
      queue: RascalQueues.DiscordListener,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.FarcasterListener]: {
      queue: RascalQueues.FarcasterListener,
      ...subscriptionConfig,
    },
  };

  const baseConfig: BrokerConfig = {
    vhosts: {
      [vhost]: {
        connection: <ConnectionConfig>rabbitmq_uri,
        exchanges: {
          [RascalExchanges.DeadLetter]: {
            ...exchangeConfig,
          },
        },
        queues: {
          [RascalQueues.DeadLetter]: {
            ...queueConfig,
          },
        },
        bindings: {
          [RascalBindings.DeadLetter]: {
            source: RascalExchanges.DeadLetter,
            destination: RascalQueues.DeadLetter,
            destinationType: 'queue',
            bindingKey: RascalRoutingKeys.DeadLetter,
          },
        },
        publications: {},
        subscriptions: {},
      },
    },
  };

  return {
    baseConfig,
    allExchanges,
    allBindings,
    allQueues,
    allPublications,
    allSubscriptions,
  };
}
