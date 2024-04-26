export enum RascalPublications {
  SnapshotListener = 'SnapshotListenerPublication',
  DiscordListener = 'DiscordMessageSubscription',
}

export enum RascalSubscriptions {
  SnapshotListener = 'SnapshotListenerSubscription',
  DiscordListener = 'DiscordMessageSubscription',
}

export enum RascalExchanges {
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange',
  Discobot = 'DiscobotExchange',
}

export enum RascalQueues {
  DeadLetter = 'DeadLetterQueue',
  SnapshotListener = 'SnapshotListenerQueueV2',
  DiscordListener = 'DiscordMessageQueueV2',
}

export enum RascalBindings {
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
}

export enum RascalRoutingKeys {
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'DeadLetter',
  DiscordListener = 'DiscordListener',
}
