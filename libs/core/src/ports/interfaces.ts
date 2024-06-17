import { z } from 'zod';
import {
  EventContext,
  EventSchemas,
  EventsHandlerMetadata,
  InvalidInput,
} from '../framework';
import { Events } from '../integration/events';
import {
  ChainProposalsNotification,
  CommentCreatedNotification,
  CommunityStakeNotification,
  SnapshotProposalCreatedNotification,
  UserMentionedNotification,
} from '../integration/notifications.schemas';
import { ILogger } from '../logging/interfaces';

/**
 * Resource disposer function
 */
export type Disposer = () => Promise<void>;

/**
 * Disposable resources
 */
export interface Disposable {
  readonly name: string;
  dispose: Disposer;
}

/**
 * Adapter factory
 */
export type AdapterFactory<T extends Disposable> = (adapter?: T) => T;

/**
 * Stats port
 * Records application stats in different forms,
 * supporting histograms, counters, flags, and traces
 */
export interface Stats extends Disposable {
  histogram(key: string, value: number, tags?: Record<string, string>): void;

  // counters
  set(key: string, value: number): void;

  increment(key: string, tags?: Record<string, string>): void;

  incrementBy(key: string, value: number, tags?: Record<string, string>): void;

  decrement(key: string, tags?: Record<string, string>): void;

  decrementBy(key: string, value: number, tags?: Record<string, string>): void;

  // flags
  on(key: string): void;

  off(key: string): void;

  // gauge
  gauge(key: string, value: number): void;

  // traces
  timing(key: string, duration: number, tags?: Record<string, string>): void;
}

export enum CacheNamespaces {
  Route_Response = 'route_response',
  Function_Response = 'function_response',
  Global_Response = 'global_response',
  Test_Redis = 'test_redis',
  Database_Cleaner = 'database_cleaner',
  Compound_Gov_Version = 'compound_gov_version',
  Token_Balance = 'token_balance',
  Activity_Cache = 'activity_cache',
  Rate_Limiter = 'rate_limiter',
}

/**
 * Cache port
 */
export interface Cache extends Disposable {
  ready(): Promise<boolean>;

  isReady(): boolean;

  getKey(namespace: CacheNamespaces, key: string): Promise<string | null>;

  setKey(
    namespace: CacheNamespaces,
    key: string,
    value: string,
    duration?: number,
    notExists?: boolean,
  ): Promise<boolean>;

  getKeys(
    namespace: CacheNamespaces,
    keys: string[],
  ): Promise<false | Record<string, unknown>>;

  setKeys(
    namespace: CacheNamespaces,
    data: { [key: string]: string },
    duration?: number,
    transaction?: boolean,
  ): Promise<false | Array<'OK' | null>>;

  getNamespaceKeys(
    namespace: CacheNamespaces,
    maxResults?: number,
  ): Promise<{ [key: string]: string } | boolean>;

  deleteKey(namespace: CacheNamespaces, key: string): Promise<number>;

  deleteNamespaceKeys(namespace: CacheNamespaces): Promise<number | boolean>;

  flushAll(): Promise<void>;

  incrementKey(
    namespace: CacheNamespaces,
    key: string,
    increment?: number,
  ): Promise<number | null>;

  decrementKey(
    namespace: CacheNamespaces,
    key: string,
    decrement?: number,
  ): Promise<number | null>;

  getKeyTTL(namespace: CacheNamespaces, key: string): Promise<number>;

  setKeyTTL(
    namespace: CacheNamespaces,
    key: string,
    ttlInSeconds: number,
  ): Promise<boolean>;
}

export type AnalyticsOptions = Record<string, any>;

/**
 * Analytics port
 */
export interface Analytics extends Disposable {
  track(event: string, payload: AnalyticsOptions): void;
}

export type RetryStrategyFn = (
  err: Error | InvalidInput | CustomRetryStrategyError,
  topic: BrokerSubscriptions,
  content: any,
  ackOrNackFn: (...args: any[]) => void,
  log: ILogger,
) => void;

export type RepublishStrategy = {
  strategy: 'republish';
  attempts: number;
  defer: number;
};

export type NackStrategy = {
  strategy: 'nack';
};

export type AckStrategy = {
  strategy: 'ack';
};

export type RequeueStrategy = {
  strategy: 'nack';
  defer: number;
  requeue: boolean;
};

export type RetryStrategies =
  | [RepublishStrategy, ...RepublishStrategy[], NackStrategy]
  | NackStrategy
  | AckStrategy
  | RequeueStrategy;

export class CustomRetryStrategyError extends Error {
  recoveryStrategy: RetryStrategies;

  constructor(message: string, recoveryStrategy: RetryStrategies) {
    super(message);
    this.recoveryStrategy = recoveryStrategy;
  }
}

export enum BrokerPublications {
  MessageRelayer = 'MessageRelayer',
  DiscordListener = 'DiscordMessage',
}

export enum BrokerSubscriptions {
  DiscordListener = 'DiscordMessage',
  ChainEvent = 'ChainEvent',
  NotificationsProvider = 'NotificationsProvider',
  ContestWorkerPolicy = 'ContestWorkerPolicy',
  ContestProjection = 'ContestProjection',
}

/**
 * Broker Port
 */
export interface Broker extends Disposable {
  publish<Name extends Events>(
    topic: BrokerPublications,
    event: EventContext<Name>,
  ): Promise<boolean>;

  subscribe<Inputs extends EventSchemas>(
    topic: BrokerSubscriptions,
    handler: EventsHandlerMetadata<Inputs>,
    retryStrategy?: RetryStrategyFn,
  ): Promise<boolean>;
}

export enum WorkflowKeys {
  CommentCreation = 'comment-creation',
  SnapshotProposals = 'snapshot-proposals',
  UserMentioned = 'user-mentioned',
  CommunityStake = 'community-stake',
  ChainProposals = 'chain-event-proposals',
  EmailRecap = 'email-recap',
  EmailDigest = 'email-digest',
}

export enum KnockChannelIds {
  InApp = 'fc6e68e5-b7b9-49c1-8fab-6dd7e3510ffb',
  SendGrid = 'a7e200fa-7d18-444c-8e42-ba7c28bb8891',
  FCM = 'c9e1b544-2130-4814-833a-a79bc527051c',
}

export type NotificationsProviderRecipient =
  | string
  | {
      collection: string;
      id: string;
    };

type BaseNotifProviderOptions = {
  users: { id: string; email?: string }[];
  actor?: { id: string; email?: string };
};

export type NotificationsProviderTriggerOptions = BaseNotifProviderOptions &
  (
    | {
        data: z.infer<typeof CommentCreatedNotification>;
        key: WorkflowKeys.CommentCreation;
      }
    | {
        data: z.infer<typeof SnapshotProposalCreatedNotification>;
        key: WorkflowKeys.SnapshotProposals;
      }
    | {
        data: z.infer<typeof UserMentionedNotification>;
        key: WorkflowKeys.UserMentioned;
      }
    | {
        data: z.infer<typeof CommunityStakeNotification>;
        key: WorkflowKeys.CommunityStake;
      }
    | {
        data: z.infer<typeof ChainProposalsNotification>;
        key: WorkflowKeys.ChainProposals;
      }
  );

export type NotificationsProviderGetMessagesOptions = {
  user_id: string;
  page_size: number;
  channel_id: string;
  cursor: string | undefined;
};

export type NotificationsProviderGetMessagesReturn = Array<{
  id: string;
  channel_id: string;
  recipient: NotificationsProviderRecipient;
  tenant: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'undelivered' | 'not_sent';
  read_at: string | null;
  seen_at: string | null;
  archived_at: string | null;
  inserted_at: string;
  updated_at: string;
  source: {
    version_id: string;
    key: string;
  };
  data: any;
  __cursor?: string;
}>;

export const RepeatFrequency = {
  Monthly: 'monthly',
  Weekly: 'weekly',
  Daily: 'daily',
  Hourly: 'hourly',
} as const;

const DaysOfWeek = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
} as const;

export type NotificationsProviderScheduleRepeats = Array<{
  frequency: typeof RepeatFrequency[keyof typeof RepeatFrequency];
  interval?: number;
  day_of_month?: number;
  days?:
    | Array<typeof DaysOfWeek[keyof typeof DaysOfWeek]>
    | 'weekdays'
    | 'weekends';
  hours?: number;
  minutes?: number;
}>;

export type NotificationsProviderSchedulesReturn = Array<{
  id: string;
  actor?: NotificationsProviderRecipient;
  recipient: NotificationsProviderRecipient;
  data: Record<string, unknown>;
  workflow: string;
  repeats: NotificationsProviderScheduleRepeats;
  last_occurrence_at?: Date;
  next_occurrence_at?: Date;
  inserted_at: string;
  updated_at: string;
}>;

/**
 * Notifications Provider Port
 */
export interface NotificationsProvider extends Disposable {
  triggerWorkflow(
    options: NotificationsProviderTriggerOptions,
  ): Promise<boolean>;

  getMessages(
    options: NotificationsProviderGetMessagesOptions,
  ): Promise<NotificationsProviderGetMessagesReturn>;

  getSchedules(options: {
    user_id: string;
    workflow_id?: WorkflowKeys;
  }): Promise<NotificationsProviderSchedulesReturn>;

  createSchedules(options: {
    user_ids: string[];
    workflow_id: WorkflowKeys;
    schedule: NotificationsProviderScheduleRepeats;
  }): Promise<NotificationsProviderSchedulesReturn>;

  /**
   * Deletes scheduled workflows
   * @param options An object containing the schedule_ids string array
   * @returns A set containing the ids of the schedules that were successfully deleted
   */
  deleteSchedules(options: { schedule_ids: string[] }): Promise<Set<string>>;

  registerClientRegistrationToken(
    userId: number,
    token: string,
  ): Promise<boolean>;
}
