import { ILogger } from '../interfaces';

export const testLogger: ILogger = {
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
};
