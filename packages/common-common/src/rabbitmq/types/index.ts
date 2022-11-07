import {CWEvent} from "chain-events/src";
import {ChainEventNotification} from "commonwealth/shared/types";
import moment from 'moment';

export class RmqMsgFormatError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export type TRmqMessages =
  | CWEvent
  | ChainEventNotification

export function isRmqMsgCWEvent(data: any): data is CWEvent {
  return (
    typeof data.blockNumber === 'number'
    && data.data
    && data.network && typeof data.network === 'string'
  );
}

export function isRmqMsgCENotification(data: any): data is ChainEventNotification {
  return (
    data.id && typeof data.id === 'string'
    && data.notification_data && typeof data.notification_data === 'string'
    && data.chain_event_id && typeof data.chain_event_id === 'string'
    && data.category_id === 'chain-event'
    && data.chain_id && typeof data.chain_id === 'string'
    && moment.isMoment(data.updated_at)
    && moment.isMoment(data.created_at)
    && data.ChainEvent
    && typeof data.ChainEvent.chain_event_type_id === 'string'
    && typeof data.ChainEvent.block_number === 'string'
  );
}

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

