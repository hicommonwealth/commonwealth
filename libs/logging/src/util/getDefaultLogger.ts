import { ILogger, LoggerIds } from '../interfaces';
import { getPinoLogger, testLogger } from '../loggers';

const TEST_WITH_LOGS = process.env.TEST_WITH_LOGS === 'true';

export const getDefaultLogger = (ids: LoggerIds): ILogger => {
  if (process.env.NODE_ENV === 'test' && !TEST_WITH_LOGS) return testLogger;
  else return getPinoLogger(ids);
};
