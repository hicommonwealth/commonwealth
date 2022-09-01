export * from './chainCUD'

import * as ChainCud from './chainCUD';

export type TRabbitMqMessages = ChainCud.TRmqMsgChainCUD

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainCUDChainEvents = 'ChainCUDChainEventsPublication',
  ChainEntityCUDMain = 'ChainEntityCUDMainPublication',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainPublication'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainCUDChainEvents = 'ChainCUDChainEventsSubscription',
  ChainEntityCUDMain = 'ChainEntityCUDMainSubscription',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainSubscription'
}

