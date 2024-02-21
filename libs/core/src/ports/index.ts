import { Analytics, Cache, Logger, Stats } from './interfaces';
import { port } from './port';

export * from './enums';
export * from './interfaces';
export * from './port';

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

/**
 * Cache port factory
 */
export const cache = port(function cache(cache?: Cache) {
  return (
    cache || {
      name: 'in-memory-cache',
      dispose: () => Promise.resolve(),
      getKey: () => Promise.resolve(''),
      setKey: () => Promise.resolve(false),
      getKeys: () => Promise.resolve(false),
      setKeys: () => Promise.resolve(false),
      getNamespaceKeys: () => Promise.resolve(false),
      deleteKey: () => Promise.resolve(0),
      deleteNamespaceKeys: () => Promise.resolve(0),
      flushAll: () => Promise.resolve(),
      incrementKey: () => Promise.resolve(0),
      decrementKey: () => Promise.resolve(0),
      getKeyTTL: () => Promise.resolve(0),
      setKeyTTL: () => Promise.resolve(false),
    }
  );
});

/**
 * Analytics port factory
 */

export const analytics = port(function analytics(analytics?: Analytics) {
  return (
    analytics || {
      name: 'in-memory-analytics',
      dispose: () => Promise.resolve(),
      track: () => {},
    }
  );
});
