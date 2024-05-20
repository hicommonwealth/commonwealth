import { config } from '../config';
import { GetLogger, ILogger, LoggerIds } from './interfaces';
import { getPinoLogger } from './pinoLogger';
import { testLogger } from './testLogger';

const getDefaultLogger = (ids: LoggerIds): ILogger => {
  if (config.NODE_ENV === 'test' && config.LOGGING.TEST_WITHOUT_LOGS)
    return testLogger;
  else return getPinoLogger(ids);
};

// Unified function implementation
export function logger(
  ids: string | LoggerIds,
  getLogger?: GetLogger,
): ILogger {
  if (!Array.isArray(ids)) ids = [ids];

  if (getLogger) {
    return getLogger(ids);
  } else {
    return getDefaultLogger(ids);
  }
}
