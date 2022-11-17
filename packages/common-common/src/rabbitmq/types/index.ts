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

export interface RmqMsgNamespace<MsgType> {
  getInvalidFormatError(...args): RmqMsgFormatError,
  isValidMsgFormat(data: any): data is MsgType,
  checkMsgFormat(data: any): void
}

/**
 * This type contains ALL the possible RabbitMQ message types. If you are publishing a message to any queue,
 * anywhere, it MUST be one of these types
 */
export type TRmqMessages =
  | RmqCWEvent.RmqMsgType
  | RmqCENotification.RmqMsgType

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsPublication'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsSubscription'
}

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  Notifications = 'NotificationsExchange',
  DeadLetter = 'DeadLetterExchange'
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  DeadLetter = 'DeadLetterQueue',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEventNotifications = 'ChainEventNotifications',
  SubstrateIdentityEvents = 'SubstrateIdentityEvents',
  DeadLetter = 'deadLetter'
}

