import pino, { DestinationStream } from 'pino';
import { GetLogger, LogContext, LoggerIds } from '../interfaces';
import { rollbar } from '../util/rollbar';

let logLevel: 'info' | 'debug';
let transport: DestinationStream;

const node_env = process.env.NODE_ENV;

if (node_env !== 'production') {
  transport = pino.transport({
    target: 'pino-pretty',
    options: {
      destination: 1, // STDOUT
      ignore: 'pid,hostname',
      errorLikeObjectKeys: ['e', 'err', 'error'],
      sync: node_env === 'test',
      colorizeObjects: false,
      singleLine: true,
    },
  });
  logLevel = 'debug';
} else logLevel = 'info';

const formatFilename = (name: string) => {
  const t = name.split('/');
  return t[t.length - 1];
};

export const getPinoLogger: GetLogger = (ids: LoggerIds) => {
  const logger = pino(
    {
      level: logLevel,
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
            filename: node_env === 'production' ? bindings.name : undefined,
            name: node_env !== 'production' ? bindings.name : undefined,
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
      logger.error({ ...context, err: error || undefined }, msg);

      if (context) rollbar.error(msg, error ?? '', context);
      else rollbar.error(msg, error ?? '');
    },
    fatal(msg: string, error?: Error, context?: LogContext) {
      logger.fatal({ ...context, err: error || undefined }, msg);

      if (context) rollbar.critical(msg, error ?? '', context);
      else rollbar.critical(msg, error ?? '');
    },
  };
};
