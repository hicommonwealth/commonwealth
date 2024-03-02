import { Logger } from '@hicommonwealth/core';
import pino, { DestinationStream } from 'pino';
import { rollbar } from '../rollbar';

let logLevel: 'info' | 'debug';
let transport: DestinationStream;

if (process.env.NODE_ENV !== 'production') {
  transport = pino.transport({
    target: 'pino-pretty',
    options: {
      destination: 1,
      include: 'time,level,name',
      sync: process.env.NODE_ENV === 'test',
    }, // STDOUT
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
              filename: bindings.name,
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
      trace(msg: string, error?: Error) {
        if (error) logger.trace(error, msg);
        else logger.trace(msg);
      },
      debug(msg: string, error?: Error) {
        if (error) logger.debug(error, msg);
        else logger.debug(msg);
      },
      info(msg: string, error?: Error) {
        if (error) logger.info(error, msg);
        else logger.info(msg);
      },
      warn(msg: string, error?: Error) {
        if (error) logger.warn(error, msg);
        else logger.warn(msg);
      },
      error(msg: string, error?: Error) {
        if (error) logger.error(error, msg);
        else logger.error(msg);
        rollbar.critical(msg, error ?? '');
      },
      fatal(msg: string, error?: Error) {
        if (error) logger.error(error, msg);
        else logger.error(msg);
        rollbar.critical(msg, error ?? '');
      },
    };
  },
});
