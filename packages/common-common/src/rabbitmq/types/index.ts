export * from './chainEventNotification';
import type { RmqCENotification } from './chainEventNotification';
import type { RmqSnapshotEvent } from './snapshotListener';
import type { RmqSnapshotNotification } from './snapshotNotification';
import { ModelStatic, Sequelize } from 'sequelize';
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
  ChainEventNotifications = 'ChainEventNotificationsPublication',
  SnapshotListener = 'SnapshotListenerPublication',
  DiscordListener = 'DiscordMessageSubscription',
}

export enum RascalSubscriptions {
  ChainEventNotifications = 'ChainEventNotificationsSubscription',
  SnapshotListener = 'SnapshotListenerSubscription',
  DiscordListener = 'DiscordMessageSubscription',
}

export enum RascalExchanges {
  Notifications = 'NotificationsExchange',
  SnapshotListener = 'SnapshotListenerExchange',
  DeadLetter = 'DeadLetterExchange',
  Discobot = 'DiscobotExchange',
}

export enum RascalQueues {
  ChainEventNotifications = 'ChainEventNotificationsQueueV2',
  DeadLetter = 'DeadLetterQueue',
  SnapshotListener = 'SnapshotListenerQueueV2',
  DiscordListener = 'DiscordMessageQueueV2',
}

export enum RascalBindings {
  ChainEventNotifications = 'ChainEventNotificationsBinding',
  SnapshotListener = 'SnapshotListenerBinding',
  DeadLetter = 'DeadLetterBinding',
  DiscordListener = 'DiscordMessageBinding',
}

export enum RascalRoutingKeys {
  ChainEventNotifications = 'ChainEventNotifications',
  SnapshotListener = 'SnapshotListener',
  DeadLetter = 'DeadLetter',
  DiscordListener = 'DiscordListener',
}

export type SafeRmqPublishSupported = ModelStatic<any>;

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
