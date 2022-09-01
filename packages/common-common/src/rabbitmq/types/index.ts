import {CWEvent} from "chain-events/src";
import { TRmqMsgChainCUD } from './chainCUD';
import {TRmqMsgEntityCUD} from './chainEntityCUD'


export * from './chainCUD'

export type TRabbitMqMessages = TRmqMsgChainCUD | TRmqMsgEntityCUD | CWEvent;

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

