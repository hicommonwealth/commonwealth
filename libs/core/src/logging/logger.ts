import { fileURLToPath } from 'url';
import { config } from '../config';
import { LogLevel } from '../ports/enums';
import { GetLogger, ILogger, LoggerIds } from './interfaces';
import { getPinoLogger } from './pinoLogger';
import { testLogger } from './testLogger';

const getDefaultLogger = (ids: LoggerIds, logLevel?: LogLevel): ILogger => {
  if (config.NODE_ENV === 'test' && config.LOGGING.TEST_WITHOUT_LOGS)
    return testLogger;
  else return getPinoLogger(ids, logLevel);
};

// Unified function implementation
export function logger(
  ids: ImportMeta | LoggerIds,
  getLogger?: GetLogger,
  logLevel?: LogLevel,
): ILogger {
  // eslint-disable-next-line no-param-reassign
  if (!Array.isArray(ids)) ids = [fileURLToPath(ids.url)];

  if (getLogger) {
    return getLogger(ids, logLevel);
  } else {
    return getDefaultLogger(ids, logLevel);
  }
}

/**
 * Composes a logger that logs Sequelize queries. Automatically downgrades log level to 'info' for 'error' and 'fatal'.
 * @param logger - The logger to use
 * @param logLevel - The log level to use
 * @returns A function that logs SQL queries to the console
 */
export function composeSequelizeLogger(
  // eslint-disable-next-line @typescript-eslint/no-shadow
  logger: ILogger,
  logLevel: LogLevel = 'trace',
) {
  if (logLevel === 'error' || logLevel === 'fatal') {
    // eslint-disable-next-line no-param-reassign
    logLevel = 'info';
  }
  return (sql: string, timestamp?: number) =>
    logger[logLevel](sql, { timestamp });
}
