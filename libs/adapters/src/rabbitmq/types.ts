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
  DiscordListener = 'DiscordMessageQueueV2',
  ChainEvent = 'ChainEventQueue',
  NotificationsProvider = 'NotificationsProviderQueue',
  ContestWorkerPolicy = 'ContestWorkerPolicyQueue',
}

export enum RascalBindings {
  NotificationsProviderCommentCreated = 'NotificationsProviderCommentCreatedBinding',
  NotificationsProviderChainEventCreated = 'NotificationsProviderChainEventCreatedBinding',
  NotificationsProviderSnapshotProposalCreated = 'NotificationsProviderSnapshotProposalCreatedBinding',
  NotificationsProviderUserMentioned = 'NotificationsProviderUserMentionedBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  ChainEvent = 'ChainEventBinding',
  ContestWorkerPolicyThreadCreated = 'ContestWorkerPolicyThreadCreatedBinding',
  ContestWorkerPolicyThreadUpvoted = 'ContestWorkerPolicyThreadUpvotedBinding',
}

export enum RascalRoutingKeys {
  NotificationsProviderCommentCreated = EventNames.CommentCreated,
  NotificationsProviderChainEventCreated = EventNames.ChainEventCreated,
  NotificationsProviderSnapshotProposalCreated = EventNames.SnapshotProposalCreated,
  NotificationsProviderUserMentioned = EventNames.UserMentioned,
  SnapshotListener = EventNames.SnapshotProposalCreated,
  DeadLetter = 'DeadLetter',
  DiscordListener = EventNames.DiscordMessageCreated,
  ChainEvent = EventNames.ChainEventCreated,
  ContestWorkerPolicyThreadCreated = EventNames.ThreadCreated,
  ContestWorkerPolicyThreadUpvoted = EventNames.ThreadUpvoted,
}
