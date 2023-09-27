import type { RmqCENotificationCUD } from './chainEventNotificationsCUD';

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
import { RmqFarcasterMessage } from './farcasterMessage';

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
  | RmqCENotificationCUD.RmqMsgType
  | RmqCWEvent.RmqMsgType
  | RmqCENotification.RmqMsgType
  | RmqSnapshotEvent.RmqMsgType
  | RmqSnapshotNotification.RmqMsgType
  | RmqDiscordMessage.RmqMsgType
  | RmqFarcasterMessage.RmqMsgType;

export interface RmqMsgNamespace<MsgType> {
  getInvalidFormatError(...args): RmqMsgFormatError;
  isValidMsgFormat(data: any): data is MsgType;
  checkMsgFormat(data: any): void;
}

export enum RascalPublications {
  ChainEvents = 'ChainEventsPublication',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainPublication',
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SnapshotListener = 'SnapshotListenerPublication',
  DiscordListener = 'DiscordMessageSubscription',
  FarcasterListener = 'FarcasterMessagePublication',
}

export enum RascalSubscriptions {
  ChainEvents = 'ChainEventsSubscription',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDSubscription',
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription',
  DiscordListener = 'DiscordMessageSubscription',
  FarcasterListener = 'FarcasterMessageSubscription',
}

export enum RascalExchanges {
  ChainEvents = 'ChainEventsExchange',
  CUD = 'CreateUpdateDeleteExchange',
  Notifications = 'NotificationsExchange',
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange',
  Discobot = 'DiscobotExchange',
  FarcasterBot = 'FarcasterBotExchange',
}

export enum RascalQueues {
  ChainEvents = 'ChainEventsQueueV2',
  ChainEventNotificationsCUDMain = 'ChainEventNotificationsCUDMainQueueV2',
  ChainEventNotifications = 'ChainEventNotificationsQueueV2',
  DeadLetter = 'DeadLetterQueue',
  SnapshotListener = 'SnapshotListenerQueue',
  DiscordListener = 'DiscordMessageQueue',
  FarcasterListener = 'FarcasterMessageQueue',
}

export enum RascalBindings {
  ChainEvents = 'ChainEventsBinding',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUDBinding',
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
  FarcasterListener = 'FarcasterMessageBinding',
}

export enum RascalRoutingKeys {
  ChainEvents = 'ChainEvents',
  ChainEventNotificationsCUD = 'ChainEventNotificationsCUD',
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'DeadLetter',
  DiscordListener = 'DiscordListener',
  FarcasterListener = 'FarcasterListener',
}

export type SafeRmqPublishSupported = ChainEventModelStatic;

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
