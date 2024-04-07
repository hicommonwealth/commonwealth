import { GetLogger, ILogger, LoggerIds } from './interfaces';
import { getPinoLogger } from './PinoLogger';

const getTestLogger: GetLogger = () => ({
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error(msg: string, error?: Error) {
    console.error(msg, error?.message);
  },
  fatal(msg: string, error?: Error) {
    console.error(msg, error?.message);
  },
});

export const getDefaultLogger = (ids: LoggerIds): ILogger => {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_WITH_LOGS)
    return getTestLogger(ids);
  else return getPinoLogger(ids);
};
