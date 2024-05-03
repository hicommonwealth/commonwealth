import { ILogger } from '@hicommonwealth/logging';
import {
  EventContext,
  EventSchemas,
  EventsHandlerMetadata,
} from '../framework';
import { Events } from '../schemas';
import {
  AnalyticsOptions,
  BrokerPublications,
  BrokerSubscriptions,
  CacheNamespaces,
} from '../types';

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

/**
 * Analytics port
 */
export interface Analytics extends Disposable {
  track(event: string, payload: AnalyticsOptions): void;
}

export type RetryStrategyFn = (
  err: Error | undefined,
  topic: BrokerSubscriptions,
  content: any,
  ackOrNackFn: (...args: any[]) => void,
  log: ILogger,
) => void;

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
