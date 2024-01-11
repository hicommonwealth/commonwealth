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
 * A logger port
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
 */
export interface Logger extends Disposable {
  getLogger(...ids: string[]): ILogger;
}
