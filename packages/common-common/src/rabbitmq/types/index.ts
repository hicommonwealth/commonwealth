import type { RmqEntityCUD } from './chainEntityCUD';
import type { RmqCENotificationCUD } from './chainEventNotificationsCUD';

export * from './chainEntityCUD';
export * from './chainEventNotificationsCUD';

export * from './chainEvents';
export * from './chainEventNotification';
import type { RmqCWEvent } from './chainEvents';
import type { RmqCENotification } from './chainEventNotification';
import type { RmqSnapshotEvent } from './snapshotListener';
import type { RmqSnapshotNotification } from './snapshotNotification';
import { Sequelize } from 'sequelize';
import { ChainEntityModelStatic } from 'chain-events/services/database/models/chain_entity';
import { ChainEventModelStatic } from 'chain-events/services/database/models/chain_event';
import { RmqDiscordMessage } from './discordMessage';

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
  | RmqEntityCUD.RmqMsgType
  | RmqCENotificationCUD.RmqMsgType
  | RmqCWEvent.RmqMsgType
  | RmqCENotification.RmqMsgType
  | RmqSnapshotEvent.RmqMsgType
  | RmqSnapshotNotification.RmqMsgType 
  | RmqDiscordMessage.RmqMsgType;

export interface RmqMsgNamespace<MsgType> {
  getInvalidFormatError(...args): RmqMsgFormatError;
  isValidMsgFormat(data: any): data is MsgType;
  checkMsgFormat(data: any): void;
}

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainEntityCUDMain = 'ChainEntityCUDMainPublication',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsPublication',
  SnapshotListener = 'SnapshotListenerPublication',
  DiscordListener = 'DiscordMessageSubscription'
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEntityCUDMain = 'ChainEntityCUDMainSubscription',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription',
  DiscordListener = 'DiscordMessageSubscription'
}

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  CUD = 'CreateUpdateDeleteExchange',
  Notifications = 'NotificationsExchange',
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange',
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueue',
  ChainEntityCUDMain = 'ChainEntityCUDMainQueue',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainQueue',
  ChainEventNotifications = 'ChainEventNotificationsQueue',
  DeadLetter = 'DeadLetterQueue',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsQueue',
  SnapshotListener = 'SnapshotListenerQueue',
  DiscordListener = 'DiscordMessageQueue'
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEntityCUDMain = 'ChainEntityCUDMainBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotProposalNotifications = 'SnapshotProposalNotificationsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding'
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEntityCUD = 'ChainEntityCUD',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotProposalNotifications = 'SnapshotProposalNotifications',
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'DeadLetter',
  DiscordListener = 'DiscordListener'
}

export type SafeRmqPublishSupported =
  | ChainEntityModelStatic
  | ChainEventModelStatic;

export abstract class AbstractRabbitMQController {
  protected _initialized = false;

  public abstract init(): Promise<void>;

  public abstract startSubscription(
    messageProcessor: (data: TRmqMessages, ...args: any) => Promise<void>,
    subscriptionName: RascalSubscriptions,
    msgProcessorContext?: { [key: string]: any }
  ): Promise<any>;

  public abstract publish(
    data: TRmqMessages,
    publisherName: RascalPublications
  ): Promise<any>;

  public abstract safePublish(
    publishData: TRmqMessages,
    objectId: number | string,
    publication: RascalPublications,
    DB: { sequelize: Sequelize; model: SafeRmqPublishSupported }
  ): Promise<any>;

  public abstract shutdown(): Promise<any>;

  public get initialized(): boolean {
    return this._initialized;
  }
}
