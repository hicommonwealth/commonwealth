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
    [RascalQueues.NotificationsSettings]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.ContestWorkerPolicy]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [RascalQueues.ContestProjection]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
  };

  const allBindings: Record<keyof OmittedRascalBindings, BindingConfig> = {
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
    [RascalBindings.NotificationsProvider]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.NotificationsProvider,
      destinationType: 'queue',
      bindingKeys: [
        RascalRoutingKeys.NotificationsProviderCommentCreated,
        RascalRoutingKeys.NotificationsProviderChainEventCreated,
        RascalRoutingKeys.NotificationsProviderSnapshotProposalCreated,
        RascalRoutingKeys.NotificationsProviderUserMentioned,
        RascalRoutingKeys.NotificationsProviderCommentUpvoted,
        RascalRoutingKeys.NotificationsProviderThreadUpvoted,
      ],
    },
    [RascalBindings.NotificationsSettings]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.NotificationsSettings,
      destinationType: 'queue',
      bindingKeys: [RascalRoutingKeys.NotificationsSettingsPreferencesUpdated],
    },
    [RascalBindings.ContestWorkerPolicy]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.ContestWorkerPolicy,
      destinationType: 'queue',
      bindingKeys: [
        RascalRoutingKeys.ContestWorkerPolicyThreadCreated,
        RascalRoutingKeys.ContestWorkerPolicyThreadUpvoted,
      ],
    },
    [RascalBindings.ContestProjection]: {
      source: RascalExchanges.MessageRelayer,
      destination: RascalQueues.ContestProjection,
      destinationType: 'queue',
      bindingKeys: [
        RascalRoutingKeys.ContestProjectionRecurringContestManagerDeployed,
        RascalRoutingKeys.ContestProjectionOneOffContestManagerDeployed,
        RascalRoutingKeys.ContestProjectionContestStarted,
        RascalRoutingKeys.ContestProjectionContestContentAdded,
        RascalRoutingKeys.ContestProjectionContestContentUpvoted,
      ],
    },
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
    [RascalSubscriptions.ContestWorkerPolicy]: {
      queue: RascalQueues.ContestWorkerPolicy,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.ContestProjection]: {
      queue: RascalQueues.ContestProjection,
      ...subscriptionConfig,
    },
    [RascalSubscriptions.NotificationsSettings]: {
      queue: RascalQueues.NotificationsSettings,
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
