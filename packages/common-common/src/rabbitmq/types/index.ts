import {CWEvent} from "chain-events/src";
import {ChainEventNotification} from "commonwealth/shared/types";

export class RmqMsgFormatError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export type TRmqMessages =
  | CWEvent
  | ChainEventNotification

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

