import { logger } from '@hicommonwealth/core';
import {
  Logger as GraphileLogger,
  LogFunctionFactory,
  WorkerPreset,
} from 'graphile-worker';
import { config } from '../../config';

const log = logger(import.meta);

const logFactory: LogFunctionFactory = (scope) => {
  return (level, message, meta) => {
    if (level === 'error') {
      log.error(message, undefined, meta);
    } else if (level === 'warning') {
      log.warn(message, meta);
    } else if (level === 'info') {
      log.info(message, meta);
    } else {
      log.debug(message, meta);
    }
  };
};

const graphileLogger = new GraphileLogger(logFactory);

export const preset: GraphileConfig.Preset = {
  extends: [WorkerPreset],
  worker: {
    connectionString:
      config.NODE_ENV !== 'production' || config.DB.NO_SSL
        ? config.DB.URI
        : config.DB.URI + '?sslmode=no-verify',
    maxPoolSize: 10,
    pollInterval: 2_000,
    preparedStatements: true,
    schema: 'graphile_worker',
    concurrentJobs: 5,
    logger: graphileLogger,
  },
};
