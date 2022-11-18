export * from "./ChainEvents"
export * from "./ChainEventNotification"
import { RmqCWEvent } from "common-common/src/rabbitmq/types/ChainEvents";
import { RmqSnapshotEvent } from "common-common/src/rabbitmq/types/SnapshotListener";
import { RmqCENotification } from "common-common/src/rabbitmq/types/ChainEventNotification";

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
  | RmqSnapshotEvent.RmqMsgType

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsPublication',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsPublication',
  SnapshotListener = 'SnapshotListenerPublication',
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsSubscription',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription',
}

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  Notifications = 'NotificationsExchange',
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange'
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsQueue',
  SnapshotListener = 'SnapshotListenerQueue',
  DeadLetter = 'DeadLetterQueue',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsBinding',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotProposalNotifications = 'SnapshotProposalNotifications',
  SnapshotListener = 'SnapshotListener',
  SubstrateIdentityEvents = 'SubstrateIdentityEvents',
  DeadLetter = 'DeadLetter',
}

