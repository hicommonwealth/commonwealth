import { RmqEntityCUD } from './chainEntityCUD'
import {
  RmqCENotificationCUD
} from "./chainEventNotificationsCUD";

export * from './chainEntityCUD';
export * from './chainEventNotificationsCUD'

export * from "./ChainEvents"
export * from "./ChainEventNotification"
import { RmqCWEvent } from "./ChainEvents";
import { RmqCENotification } from "./ChainEventNotification";
import { RmqSnapshotEvent } from "./snapshotListener";
import { RmqSnapshotNotification } from "./snapshotNotification";

/**
 * This error type should be used in tandem with isRmqMsg functions. If this error type is thrown, RabbitMQ
 * will immediately dead-letter the message in question instead of using the requeue strategy.
 */
export class RmqMsgFormatError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

/**
 * This type contains ALL the possible RabbitMQ message types. If you are publishing a message to any queue,
 * anywhere, it MUST be one of these types
 */
export type TRmqMessages =
  RmqEntityCUD.RmqMsgType
  | RmqCENotificationCUD.RmqMsgType
  | RmqCWEvent.RmqMsgType
  | RmqCENotification.RmqMsgType
  | RmqSnapshotEvent.RmqMsgType
  | RmqSnapshotNotification.RmqMsgType

export interface RmqMsgNamespace<MsgType> {
  getInvalidFormatError(...args): RmqMsgFormatError,
  isValidMsgFormat(data: any): data is MsgType,
  checkMsgFormat(data: any): void
}

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainEntityCUDMain = 'ChainEntityCUDMainPublication',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SnapshotListener = 'SnapshotListenerPublication'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEntityCUDMain = 'ChainEntityCUDMainSubscription',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription'
}

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  CUD = 'CreateUpdateDeleteExchange',
  Notifications = 'NotificationsExchange',
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange'
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueue',
  ChainEntityCUDMain = 'ChainEntityCUDMainQueue',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  SnapshotListener = 'SnapshotListenerQueue',
  DeadLetter = 'DeadLetterQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEntityCUDMain = 'ChainEntityCUDMainBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEntityCUD = 'ChainEntityCUD',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'deadLetter'
}



