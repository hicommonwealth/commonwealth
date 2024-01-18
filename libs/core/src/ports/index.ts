import { Logger, Stats } from './interfaces';
import { port } from './port';

export * from './enums';
export * from './interfaces';

/**
 * Logger port factory
 */
export const logger = port(function logger(logger?: Logger) {
  return (
    logger || {
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
    }
  );
});

/**
 * Stats port factory
 */
export const stats = port(function stats(stats?: Stats) {
  return (
    stats || {
      name: 'in-memory-stats',
      dispose: () => Promise.resolve(),
      histogram: () => {},
      set: () => {},
      increment: () => {},
      incrementBy: () => {},
      decrement: () => {},
      decrementBy: () => {},
      on: () => {},
      off: () => {},
      timing: () => {},
    }
  );
});
