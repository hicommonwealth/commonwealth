import {
  BrokerPublications,
  BrokerSubscriptions,
  EventNames,
  RoutingKeyTags,
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
  ContestProjection = BrokerSubscriptions.ContestProjection,
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
  ContestProjection = 'ContestProjection',
}

export enum RascalBindings {
  NotificationsProvider = 'NotificationsProvider',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  ChainEvent = 'ChainEventBinding',
  ContestWorkerPolicy = 'ContestWorkerPolicy',
  ContestProjection = 'ContestProjection',
}

export enum RascalRoutingKeys {
  NotificationsProviderCommentCreated = EventNames.CommentCreated,
  NotificationsProviderCommentUpvoted = EventNames.CommentUpvoted,
  NotificationsProviderThreadUpvoted = `${EventNames.ThreadUpvoted}.#`,
  NotificationsProviderChainEventCreated = EventNames.ChainEventCreated,
  NotificationsProviderSnapshotProposalCreated = EventNames.SnapshotProposalCreated,
  NotificationsProviderUserMentioned = EventNames.UserMentioned,
  NotificationsProviderPreferencesUpdated = EventNames.SubscriptionPreferencesUpdated,

  DeadLetter = 'DeadLetter',
  DiscordListener = EventNames.DiscordMessageCreated,
  ChainEvent = EventNames.ChainEventCreated,

  ContestWorkerPolicyThreadCreated = `${EventNames.ThreadCreated}.${RoutingKeyTags.Contest}.#`,
  ContestWorkerPolicyThreadUpvoted = `${EventNames.ThreadUpvoted}.${RoutingKeyTags.Contest}.#`,

  ContestProjectionRecurringContestManagerDeployed = EventNames.RecurringContestManagerDeployed,
  ContestProjectionOneOffContestManagerDeployed = EventNames.OneOffContestManagerDeployed,
  ContestProjectionContestStarted = EventNames.ContestStarted,
  ContestProjectionContestContentAdded = EventNames.ContestContentAdded,
  ContestProjectionContestContentUpvoted = EventNames.ContestContentUpvoted,
}
