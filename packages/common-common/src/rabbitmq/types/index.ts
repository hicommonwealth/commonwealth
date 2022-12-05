import {RmqEntityCUD} from './chainEntityCUD'
import {
  RmqCENotificationCUD
} from "./chainEventNotificationsCUD";
import {RmqCETypeCUD} from "./chainEventTypeCUD";

export * from './chainEntityCUD';
export * from './chainEventNotificationsCUD'
export * from './chainEventTypeCUD'

export * from "./ChainEvents"
export * from "./ChainEventNotification"
import {RmqCWEvent} from "common-common/src/rabbitmq/types/ChainEvents";
import {RmqCENotification} from "common-common/src/rabbitmq/types/ChainEventNotification";

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
  | RmqCETypeCUD.RmqMsgType
  | RmqCWEvent.RmqMsgType
  | RmqCENotification.RmqMsgType

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
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainPublication'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
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
  ChainEntityCUDMain = 'ChainEntityCUDMainQueue',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainQueue',
  DeadLetter = 'DeadLetterQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEntityCUDMain = 'ChainEntityCUDMainBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  ChainEventType = 'ChainEventTypeBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEntityCUD = 'ChainEntityCUD',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  ChainEventTypeCUD = 'ChainEventTypeCUD',
  DeadLetter = 'deadLetter'
}

