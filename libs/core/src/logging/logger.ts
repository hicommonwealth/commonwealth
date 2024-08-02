import { fileURLToPath } from 'url';
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
  ids: ImportMeta | LoggerIds,
  getLogger?: GetLogger,
): ILogger {
  if (!Array.isArray(ids)) ids = [fileURLToPath(ids.url)];

  if (getLogger) {
    return getLogger(ids);
  } else {
    return getDefaultLogger(ids);
  }
}
