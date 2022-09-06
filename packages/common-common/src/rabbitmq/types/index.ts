import {CWEvent} from "chain-events/src";
import {TRmqMsgChainCUD} from './chainCUD';
import {TRmqMsgEntityCUD} from './chainEntityCUD'
import {TRmqMsgCENotificationsCUD} from "./chainEventNotificationsCUD";
import {ChainEventNotification} from "commonwealth/shared/types";
import {TRmqMsgCETypeCUD} from "./chainEventTypeCUD";


export * from './chainCUD'
export * from './chainEntityCUD';
export * from './chainEventNotificationsCUD'

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

