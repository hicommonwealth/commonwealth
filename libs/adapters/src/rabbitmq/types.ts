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
  NotificationsProviderCommentCreated = 'NotificationsProviderCommentCreatedBinding',
  NotificationsProviderChainEventCreated = 'NotificationsProviderChainEventCreatedBinding',
  NotificationsProviderSnapshotProposalCreated = 'NotificationsProviderSnapshotProposalCreatedBinding',
  NotificationsProviderUserMentioned = 'NotificationsProviderUserMentionedBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  ChainEvent = 'ChainEventBinding',

  ContestWorkerPolicyThreadCreated = 'ContestWorkerPolicyThreadCreatedBinding',
  ContestWorkerPolicyThreadUpvoted = 'ContestWorkerPolicyThreadUpvotedBinding',
  ContestWorkerPolicyRecurringContestManagerDeployed = 'ContestWorkerPolicyRecurringContestManagerDeployed',
  ContestWorkerPolicyOneOffContestManagerDeployed = 'ContestWorkerPolicyOneOffContestManagerDeployed',
  ContestWorkerPolicyContestStarted = 'ContestWorkerPolicyContestStarted',
  ContestWorkerPolicyContestContentAdded = 'ContestWorkerPolicyContestContentAdded',
  ContestWorkerPolicyContestContentUpvoted = 'ContestWorkerPolicyContestContentUpvoted',
  ContestWorkerPolicyContestWinnersRecorded = 'ContestWorkerPolicyContestWinnersRecorded',
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
  ContestWorkerPolicyRecurringContestManagerDeployed = EventNames.RecurringContestManagerDeployed,
  ContestWorkerPolicyOneOffContestManagerDeployed = EventNames.OneOffContestManagerDeployed,
  ContestWorkerPolicyContestStarted = EventNames.ContestStarted,
  ContestWorkerPolicyContestContentAdded = EventNames.ContestContentAdded,
  ContestWorkerPolicyContestContentUpvoted = EventNames.ContestContentUpvoted,
  ContestWorkerPolicyContestWinnersRecorded = EventNames.ContestWinnersRecorded,
}
