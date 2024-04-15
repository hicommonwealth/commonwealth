import { ILogger, LoggerIds } from '../interfaces';
import { getPinoLogger, testLogger } from '../loggers';

// By default we test WTIH logs - logs in tests can be disabled for all in CI
const TEST_WITHOUT_LOGS = process.env.TEST_WITHOUT_LOGS === 'true';

export const getDefaultLogger = (ids: LoggerIds): ILogger => {
  if (process.env.NODE_ENV === 'test' && TEST_WITHOUT_LOGS) return testLogger;
  else return getPinoLogger(ids);
};
