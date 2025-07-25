import pino, { DestinationStream } from 'pino';
import { ZodError } from 'zod';
import { config } from '../config';
import { LogLevel } from '../ports/enums';
import { GetLogger, LogContext, LoggerIds } from './interfaces';
import { rollbar } from './rollbar';

let transport: DestinationStream;

const formatFilename = (name: string) => {
  const t = name.split('/');
  return t[t.length - 1];
};

if (config.NODE_ENV !== 'production') {
  transport = pino.transport({
    target: 'pino-pretty',
    options: {
      destination: 1, // STDOUT
      ignore: 'pid,hostname',
      errorLikeObjectKeys: ['e', 'err', 'error'],
      sync: config.NODE_ENV === 'test',
      colorizeObjects: false,
      singleLine: true,
    },
  });
}

export const getPinoLogger: GetLogger = (
  ids: LoggerIds,
  logLevel?: LogLevel,
) => {
  const logger = pino(
    {
      level: logLevel ?? config.LOGGING.LOG_LEVEL,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
        bindings: (bindings) => {
          return {
            level: bindings.level,
            time: bindings.time,
            hostname: bindings.hostname,
            pid: bindings.pid,
            filename:
              config.NODE_ENV === 'production' ? bindings.name : undefined,
            name: config.NODE_ENV !== 'production' ? bindings.name : undefined,
            ids: ids.length > 1 ? ids.slice(1) : undefined,
          };
        },
      },
      redact: {
        paths: ['jwt', 'query.jwt', 'params.jwt', 'body.jwt'],
        censor: '[PINO REDACTED]',
      },
      name: formatFilename(ids[0]),
    },
    transport,
  );

  return {
    trace(msg: string, context?: LogContext) {
      logger.trace({ ...context }, msg);
    },
    debug(msg: string, context?: LogContext) {
      logger.debug({ ...context }, msg);
    },
    info(msg: string, context?: LogContext) {
      logger.info({ ...context }, msg);
    },
    warn(msg: string, context?: LogContext) {
      logger.warn({ ...context }, msg);
    },
    error(msg: string, error?: Error, context?: LogContext) {
      let err: Error | Record<string, unknown> | undefined = error;
      if (error instanceof ZodError) {
        err = error.format();
      }

      logger.error({ ...context, err: err || undefined }, msg);
      if (context) rollbar.error(msg, error ?? '', context);
      else rollbar.error(msg, error ?? '');
    },
    fatal(msg: string, error?: Error, context?: LogContext) {
      // Railway doesn't currently normalize fatal logs as errors so must log as errors for now
      if (config.NODE_ENV === 'production')
        logger.error({ ...context, err: error || undefined }, msg);
      else logger.fatal({ ...context, err: error || undefined }, msg);

      if (context) rollbar.critical(msg, error ?? '', context);
      else rollbar.critical(msg, error ?? '');
    },
  };
};
