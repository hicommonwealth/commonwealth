import { AnalyticsOptions, CacheNamespaces } from '../types';

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
 * Logger port
 * Logs messages at different levels
 */
export interface ILogger {
  trace(msg: string, error?: Error, context?: Record<string, unknown>): void;
  debug(msg: string, error?: Error, context?: Record<string, unknown>): void;
  info(msg: string, error?: Error, context?: Record<string, unknown>): void;
  warn(msg: string, error?: Error, context?: Record<string, unknown>): void;
  error(msg: string, error?: Error, context?: Record<string, unknown>): void;
  fatal(msg: string, error?: Error, context?: Record<string, unknown>): void;
}
/**
 * Logger factory
 * Builds a named logger
 */
export interface Logger extends Disposable {
  getLogger(...ids: string[]): ILogger;
}

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
  // traces
  timing(key: string, duration: number, tags?: Record<string, string>): void;
}

/**
 * Cache port
 */
export interface Cache extends Disposable {
  getKey(namespace: CacheNamespaces, key: string): Promise<string | undefined>;
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
  ): Promise<false | Record<string, unknown> | undefined>;
  setKeys(
    namespace: CacheNamespaces,
    data: { [key: string]: string },
    duration?: number,
    transaction?: boolean,
  ): Promise<false | Array<'OK' | null> | undefined>;
  getNamespaceKeys(
    namespace: CacheNamespaces,
    maxResults?: number,
  ): Promise<{ [key: string]: string } | boolean | undefined>;
  deleteKey(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<number | undefined>;
  deleteNamespaceKeys(namespace: CacheNamespaces): Promise<number | boolean>;
  flushAll(): Promise<void>;
  incrementKey(
    namespace: CacheNamespaces,
    key: string,
    increment?: number,
  ): Promise<number | null | undefined>;
  decrementKey(
    namespace: CacheNamespaces,
    key: string,
    decrement?: number,
  ): Promise<number | null | undefined>;
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
