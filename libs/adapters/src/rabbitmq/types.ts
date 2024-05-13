import {
  BrokerPublications,
  BrokerSubscriptions,
  EventNames,
} from '@hicommonwealth/core';

export enum RascalPublications {
  DiscordListener = BrokerPublications.DiscordListener,
  MessageRelayer = BrokerPublications.MessageRelayer,
}

// SnapshotListener and ChainEvent subscriptions will eventually be replaced by NotificationsProvider
export enum RascalSubscriptions {
  SnapshotListener = BrokerSubscriptions.SnapshotListener,
  DiscordListener = BrokerSubscriptions.DiscordListener,
  ChainEvent = BrokerSubscriptions.ChainEvent,
  NotificationsProvider = BrokerSubscriptions.NotificationsProvider,
  ContestWorkerPolicy = BrokerSubscriptions.ContestWorkerPolicy,
}

export enum RascalExchanges {
  DeadLetter = 'DeadLetterExchange',
  Discobot = 'DiscobotExchange',
  MessageRelayer = 'MessageRelayerExchange',
}

export enum RascalQueues {
  DeadLetter = 'DeadLetterQueue',
  SnapshotListener = 'SnapshotListenerQueueV2',
  DiscordListener = 'DiscordMessageQueueV2',
  ChainEvent = 'ChainEventQueue',
  NotificationsProvider = 'NotificationsProviderQueue',
  ContestWorkerPolicy = 'ContestWorkerPolicyQueue',
}

export enum RascalBindings {
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  ChainEvent = 'ChainEventBinding',
  ContestWorkerPolicyThreadCreated = 'ContestWorkerPolicyThreadCreatedBinding',
  ContestWorkerPolicyThreadUpvoted = 'ContestWorkerPolicyThreadUpvotedBinding',
}

export enum RascalRoutingKeys {
  SnapshotListener = EventNames.SnapshotProposalCreated,
  DeadLetter = 'DeadLetter',
  DiscordListener = EventNames.DiscordMessageCreated,
  ChainEvent = EventNames.ChainEventCreated,
  ContestWorkerPolicyThreadCreated = EventNames.ThreadCreated,
  ContestWorkerPolicyThreadUpvoted = EventNames.ThreadUpvoted,
}
