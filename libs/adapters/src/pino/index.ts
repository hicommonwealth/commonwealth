import { Logger } from '@hicommonwealth/core';
import pino, { DestinationStream } from 'pino';
import { rollbar } from '../rollbar';

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
    },
  });
  logLevel = 'debug';
} else logLevel = 'info';

const formatFilename = (name: string) => {
  const t = name.split('/');
  return t[t.length - 1];
};

export const PinoLogger = (): Logger => ({
  name: 'PinoLogger',
  dispose: () => Promise.resolve(),
  getLogger: (filename: string, ...ids: string[]) => {
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
              ids: ids.length > 0 ? ids : undefined,
            };
          },
        },
        redact: {
          paths: [],
          censor: '[PINO REDACTED]',
        },
        name: formatFilename(filename),
      },
      transport,
    );

    return {
      trace(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.trace({ ...context, err: error }, msg);
      },
      debug(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.debug({ ...context, err: error }, msg);
      },
      info(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.info({ ...context, err: error }, msg);
      },
      warn(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.warn({ ...context, err: error }, msg);
      },
      error(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.error({ ...context, err: error }, msg);

        if (context) rollbar.error(msg, error ?? '', context);
        else rollbar.error(msg, error ?? '');
      },
      fatal(msg: string, error?: Error, context?: Record<string, unknown>) {
        logger.fatal({ ...context, err: error }, msg);

        if (context) rollbar.critical(msg, error ?? '', context);
        else rollbar.critical(msg, error ?? '');
      },
    };
  },
});
