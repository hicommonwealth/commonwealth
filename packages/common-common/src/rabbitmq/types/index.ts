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

/**
 * This type contains ALL the possible RabbitMQ message types. If you are publishing a message to any queue,
 * anywhere, it MUST be one of these types
 */
export type TRmqMessages =
  RmqEntityCUD.RmqMsgType
  | RmqCENotificationCUD.RmqMsgType
  | RmqCETypeCUD.RmqMsgType
  | RmqSnapshotEvent.RmqMsgType

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
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsPublication',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsPublication',
  SnapshotListener = 'SnapshotListenerPublication',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainPublication'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEntityCUDMain = 'ChainEntityCUDMainSubscription',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsSubscription',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainSubscription'
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
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsQueue',
  SnapshotListener = 'SnapshotListenerQueue',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsQueue',
  ChainEventTypeCUDMain = 'ChainEventTypeCUDMainQueue',
  DeadLetter = 'DeadLetterQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEntityCUDMain = 'ChainEntityCUDMainBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsBinding',
  SubstrateIdentityEvents = 'SubstrateIdentityEventsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  ChainEventType = 'ChainEventTypeBinding',
  DeadLetter = 'DeadLetterBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEntityCUD = 'ChainEntityCUD',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotProposalNotifications = 'SnapshotProposalNotifications',
  SnapshotListener = 'SnapshotListener',
  SubstrateIdentityEvents = 'SubstrateIdentityEvents',
  ChainEventTypeCUD = 'ChainEventTypeCUD',
  DeadLetter = 'deadLetter'
}

