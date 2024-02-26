import { Logger } from './interfaces';

const devLogger: Logger = {
  name: 'in-memory-logger',
  dispose: () => Promise.resolve(),
  getLogger: () => ({
    trace(msg: string) {
      console.log(msg);
    },
    debug(msg: string) {
      console.log(msg);
    },
    info(msg: string) {
      console.log(msg);
    },
    warn(msg: string) {
      console.log(msg);
    },
    error(msg: string, error?: Error) {
      console.error(msg, error?.message);
    },
    fatal(msg: string, error?: Error) {
      console.error(msg, error?.message);
    },
  }),
};

const testLogger: Logger = {
  name: 'in-memory-logger',
  dispose: () => Promise.resolve(),
  getLogger: () => ({
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
  }),
};

export const getInMemoryLogger = () =>
  process.env.NODE_ENV === 'test' ? testLogger : devLogger;
