export enum RascalPublications {
  SnapshotListener = 'SnapshotListenerPublication',
  DiscordListener = 'DiscordMessagePublication',
  ChainEvent = 'ChainEventPublication',
}

export enum RascalSubscriptions {
  SnapshotListener = 'SnapshotListenerSubscription',
  DiscordListener = 'DiscordMessageSubscription',
  ChainEvent = 'ChainEventSubscription',
}

export enum RascalExchanges {
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange',
  Discobot = 'DiscobotExchange',
  ChainEvent = 'ChainEventExchange',
}

export enum RascalQueues {
  DeadLetter = 'DeadLetterQueue',
  SnapshotListener = 'SnapshotListenerQueueV2',
  DiscordListener = 'DiscordMessageQueueV2',
  ChainEvent = 'ChainEventQueue',
}

export enum RascalBindings {
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  ChainEvent = 'ChainEventBinding',
}

export enum RascalRoutingKeys {
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'DeadLetter',
  DiscordListener = 'DiscordListener',
  ChainEvent = 'ChainEvent',
}
