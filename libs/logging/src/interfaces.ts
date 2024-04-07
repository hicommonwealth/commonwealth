export type LogContext = {
  // fingerprint is a Rollbar concept that helps Rollbar group error occurrences together
  fingerprint?: string;
  [key: string]: unknown;
};

/**
 * Logger port
 * Logs messages at different levels
 */
export interface ILogger {
  trace(msg: string, error?: Error, context?: LogContext): void;
  debug(msg: string, error?: Error, context?: LogContext): void;
  info(msg: string, error?: Error, context?: LogContext): void;
  warn(msg: string, error?: Error, context?: LogContext): void;
  error(msg: string, error?: Error, context?: LogContext): void;
  fatal(msg: string, error?: Error, context?: LogContext): void;
}

export type LoggerIds = [string, ...string[]];

export type GetLogger = (ids: LoggerIds) => ILogger;
