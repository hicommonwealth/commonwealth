import {
  BindingConfig,
  BrokerConfig,
  ConnectionConfig,
  ExchangeConfig,
  PublicationConfig,
  QueueConfig,
  SubscriptionConfig,
} from 'rascal';
import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalRoutingKeys,
  RascalSubscriptions,
} from '../types';

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

export type getAllRascalConfigsType = {
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
  purge: boolean,
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
    [RascalExchanges.Discobot]: {
      type: 'fanout',
      ...exchangeConfig,
    },
    [RascalExchanges.MessageRelayer]: {
      type: 'topic',
      ...exchangeConfig,
    },
  };

  const allQueues: Record<keyof OmittedRascalQueue, QueueConfig> = {
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
    [RascalQueues.ChainEvent]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.NotificationsProvider]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
  };

  const allBindings: Record<keyof OmittedRascalBindings, BindingConfig> = {
    [RascalBindings.SnapshotListener]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.SnapshotListener,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.SnapshotListener,
    },
    [RascalBindings.ChainEvent]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.ChainEvent,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.ChainEvent,
    },
    [RascalBindings.DiscordListener]: {
      source: RascalExchanges.Discobot,
      destination: RascalQueues.DiscordListener,
      destinationType: 'queue',
      bindingKey: RascalRoutingKeys.DiscordListener,
    },
    // TODO: add a binding from the MessageRelayer to NotificationsProvider queue with * binding key
  };

  const allPublications: Record<RascalPublications, PublicationConfig> = {
    [RascalPublications.DiscordListener]: {
      exchange: RascalExchanges.Discobot,
      routingKey: RascalRoutingKeys.DiscordListener,
      ...publicationConfig,
    },
    [RascalPublications.MessageRelayer]: {
      exchange: RascalExchanges.MessageRelayer,
      ...publicationConfig,
    },
  };

  const allSubscriptions: Record<RascalSubscriptions, SubscriptionConfig> = {
    [RascalSubscriptions.SnapshotListener]: {
      queue: RascalQueues.SnapshotListener,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.DiscordListener]: {
      queue: RascalQueues.DiscordListener,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.ChainEvent]: {
      queue: RascalQueues.ChainEvent,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.NotificationsProvider]: {
      queue: RascalQueues.NotificationsProvider,
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
