import {CWEvent} from "chain-events/src";
import {isTRmqMsgChainCUD, TRmqMsgChainCUD} from './chainCUD';
import {isTRmqMsgEntityCUD, TRmqMsgEntityCUD} from './chainEntityCUD'
import {isTRmqMsgCENotificationsCUD, TRmqMsgCENotificationsCUD} from "./chainEventNotificationsCUD";
import {ChainEventNotification} from "commonwealth/shared/types";
import {isTRmqMsgCETypeCUD, TRmqMsgCETypeCUD} from "./chainEventTypeCUD";


export * from './chainCUD'
export * from './chainEntityCUD';
export * from './chainEventNotificationsCUD'
export * from './chainEventTypeCUD'

export function rmqMsgToName(data: TRmqMessages) {
  if (isTRmqMsgChainCUD(data)) return 'Chain'
  else if (isTRmqMsgEntityCUD(data)) return 'ChainEntity'
  else if (isTRmqMsgCENotificationsCUD(data)) return 'ChainEvent'
  else if (isTRmqMsgCETypeCUD(data)) return 'ChainEventType'
}

export type TRmqMessages =
  TRmqMsgChainCUD
  | TRmqMsgEntityCUD
  | TRmqMsgCENotificationsCUD
  | CWEvent
  | ChainEventNotification
  | TRmqMsgCETypeCUD;

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

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  CUD = 'CreateUpdateDeleteExchange',
  Notifications = 'NotificationsExchange',
  DeadLetter = 'DeadLetterExchange'
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueue',
  ChainCUDChainEvents = 'ChainCUDChainEventsQueue',
  ChainEntityCUDMain = 'ChainEntityCUDMainQueue',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainQueue',
  DeadLetter = 'DeadLetterQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainCUDChainEvents = 'ChainCUDChainEventsBinding',
  ChainEntityCUDMain = 'ChainEntityCUDMainBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  ChainEventType = 'ChainEventTypeBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainCUD = 'ChainCUD',
  ChainEntityCUD = 'ChainEntityCUD',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  ChainEventTypeCUD = 'ChainEventTypeCUD',
  DeadLetter = 'deadLetter'
}

