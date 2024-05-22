import { fileURLToPath } from 'url';
import { config } from '../config';
import { logger } from '../logging';
import { ExitCode } from './enums';
import { successfulInMemoryBroker } from './in-memory-brokers';
import {
  AdapterFactory,
  Analytics,
  Broker,
  Cache,
  Disposable,
  Disposer,
  NotificationsProvider,
  Stats,
} from './interfaces';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

/**
 * Map of disposable adapter instances
 */
const adapters = new Map<string, Disposable>();

/**
 * Wraps creation of adapters around factory functions
 * @param factory adapter of T factory function
 * @returns adapter instance
 */
export function port<T extends Disposable>(factory: AdapterFactory<T>) {
  return function (adapter?: T) {
    if (!adapters.has(factory.name)) {
      const instance = factory(adapter);
      adapters.set(factory.name, instance);
      log.info(`[binding adapter] ${instance.name || factory.name}`);
      return instance;
    }
    return adapters.get(factory.name) as T;
  };
}

/**
 * Register of resource disposers on exit
 */
const disposers: Disposer[] = [];

/**
 * Internal disposer and process killer
 * @param code exit code, defaults to unit testing
 */
const disposeAndExit = async (code: ExitCode = 'UNIT_TEST'): Promise<void> => {
  // don't kill process when errors are caught in production
  if (code === 'ERROR' && config.NODE_ENV === 'production') return;

  // call disposers
  await Promise.all(disposers.map((disposer) => disposer()));
  await Promise.all(
    [...adapters].reverse().map(async ([key, adapter]) => {
      log.info(`[disposing adapter] ${adapter.name || key}`);
      await adapter.dispose();
    }),
  );
  adapters.clear();

  // exit when not unit testing
  config.NODE_ENV !== 'test' &&
    code !== 'UNIT_TEST' &&
    process.exit(code === 'ERROR' ? 1 : 0);
};

export const disposeAdapter = (name: string): void => {
  adapters.get(name)?.dispose();
  adapters.delete(name);
  adapters.clear();
};

/**
 * Registers resource disposers that get triggered on process exits
 * @param disposer the disposer function
 * @returns a function that triggers all registered disposers and terminates the process
 */
export const dispose = (
  disposer?: Disposer,
): ((code?: ExitCode) => Promise<void>) => {
  disposer && disposers.push(disposer);
  return disposeAndExit;
};

/**
 * Handlers to dispose registered resources on exit or unhandled exceptions
 */
process.once('SIGINT', async (arg?: any) => {
  log.info(`SIGINT ${arg !== 'SIGINT' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
process.once('SIGTERM', async (arg?: any) => {
  log.info(`SIGTERM ${arg !== 'SIGTERM' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
process.once('uncaughtException', async (arg?: any) => {
  log.error('Uncaught Exception', arg);
  await disposeAndExit('ERROR');
});
process.once('unhandledRejection', async (arg?: any) => {
  log.error('Unhandled Rejection', arg);
  await disposeAndExit('ERROR');
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
      gauge: () => {},
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
      ready: () => Promise.resolve(true),
      isReady: () => true,
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

/**
 * Broker port factory
 */
export const broker = port(function broker(broker?: Broker) {
  return broker || successfulInMemoryBroker;
});

export const notificationsProvider = port(function notificationsProvider(
  notificationsProvider?: NotificationsProvider,
) {
  return (
    notificationsProvider || {
      name: 'in-memory-notifications-provider',
      dispose: () => Promise.resolve(),
      triggerWorkflow: () => Promise.resolve(true),
      getMessages: () => Promise.resolve([]),
    }
  );
});
