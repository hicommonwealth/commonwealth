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
  NotificationsSettings = BrokerSubscriptions.NotificationsSettings,
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
  NotificationsSettings = 'NotificationsSettingsQueue',
  ContestWorkerPolicy = 'ContestWorkerPolicyQueue',
  ContestProjection = 'ContestProjection',
}

export enum RascalBindings {
  NotificationsProvider = 'NotificationsProvider',
  NotificationsSettings = 'NotificationsSettings',
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

  NotificationsSettingsPreferencesUpdated = EventNames.SubscriptionPreferencesUpdated,

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
