import {
  BrokerPublications,
  BrokerSubscriptions,
  EventNames,
  RoutingKeyTags,
} from '@hicommonwealth/core';

export enum RascalPublications {
  MessageRelayer = BrokerPublications.MessageRelayer,
}

// SnapshotListener and ChainEvent subscriptions will eventually be replaced by NotificationsProvider
export enum RascalSubscriptions {
  DiscordBotPolicy = BrokerSubscriptions.DiscordBotPolicy,
  ChainEvent = BrokerSubscriptions.ChainEvent,
  NotificationsProvider = BrokerSubscriptions.NotificationsProvider,
  NotificationsSettings = BrokerSubscriptions.NotificationsSettings,
  ContestWorkerPolicy = BrokerSubscriptions.ContestWorkerPolicy,
  ContestProjection = BrokerSubscriptions.ContestProjection,
  FarcasterWorkerPolicy = BrokerSubscriptions.FarcasterWorkerPolicy,
}

export enum RascalExchanges {
  DeadLetter = 'DeadLetterExchange',
  MessageRelayer = 'MessageRelayerExchange',
}

export enum RascalQueues {
  DeadLetter = 'DeadLetterQueue',
  DiscordBotPolicy = 'DiscordBotPolicy',
  ChainEvent = 'ChainEventQueue',
  NotificationsProvider = 'NotificationsProviderQueue',
  NotificationsSettings = 'NotificationsSettingsQueue',
  ContestWorkerPolicy = 'ContestWorkerPolicyQueue',
  ContestProjection = 'ContestProjection',
  FarcasterWorkerPolicy = 'FarcasterWorkerPolicyQueue',
}

export enum RascalBindings {
  NotificationsProvider = 'NotificationsProvider',
  NotificationsSettings = 'NotificationsSettings',
  DeadLetter = 'DeadLetterBinding',
  DiscordBotPolicy = 'DiscordBotPolicy',
  ChainEvent = 'ChainEventBinding',
  ContestWorkerPolicy = 'ContestWorkerPolicy',
  ContestProjection = 'ContestProjection',
  FarcasterWorkerPolicy = 'FarcasterWorkerPolicy',
}

export enum RascalRoutingKeys {
  NotificationsProviderCommentCreated = EventNames.CommentCreated,
  NotificationsProviderCommentUpvoted = EventNames.CommentUpvoted,
  NotificationsProviderThreadUpvoted = `${EventNames.ThreadUpvoted}.#`,
  NotificationsProviderChainEventCreated = EventNames.ChainEventCreated,
  NotificationsProviderSnapshotProposalCreated = EventNames.SnapshotProposalCreated,
  NotificationsProviderUserMentioned = EventNames.UserMentioned,

  NotificationsSettingsPreferencesUpdated = EventNames.SubscriptionPreferencesUpdated,

  DiscordThreadCreated = EventNames.DiscordThreadCreated,
  DiscordThreadBodyUpdated = EventNames.DiscordThreadBodyUpdated,
  DiscordThreadTitleUpdated = EventNames.DiscordThreadTitleUpdated,
  DiscordThreadDeleted = EventNames.DiscordThreadDeleted,
  DiscordThreadCommentCreated = EventNames.DiscordThreadCommentCreated,
  DiscordThreadCommentUpdated = EventNames.DiscordThreadCommentUpdated,
  DiscordThreadCommentDeleted = EventNames.DiscordThreadCommentDeleted,

  DeadLetter = 'DeadLetter',
  ChainEvent = EventNames.ChainEventCreated,

  ContestWorkerPolicyThreadCreated = `${EventNames.ThreadCreated}.${RoutingKeyTags.Contest}.#`,
  ContestWorkerPolicyThreadUpvoted = `${EventNames.ThreadUpvoted}.${RoutingKeyTags.Contest}.#`,

  ContestProjectionRecurringContestManagerDeployed = EventNames.RecurringContestManagerDeployed,
  ContestProjectionOneOffContestManagerDeployed = EventNames.OneOffContestManagerDeployed,
  ContestProjectionContestStarted = EventNames.ContestStarted,
  ContestProjectionContestContentAdded = EventNames.ContestContentAdded,
  ContestProjectionContestContentUpvoted = EventNames.ContestContentUpvoted,

  FarcasterWorkerPolicyCastCreated = EventNames.FarcasterCastCreated,
  FarcasterWorkerPolicyReplyCastCreated = EventNames.FarcasterReplyCastCreated,
  FarcasterWorkerPolicyVoteCreated = EventNames.FarcasterVoteCreated,
}
