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
 * A logger port
 * Logs messages at different levels
 */
export interface ILogger {
  trace(msg: string, error?: Error): void;
  debug(msg: string, error?: Error): void;
  info(msg: string, error?: Error): void;
  warn(msg: string, error?: Error): void;
  error(msg: string, error?: Error): void;
  fatal(msg: string, error?: Error): void;
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
