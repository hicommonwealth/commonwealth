import { config } from '../config';
import { logger, rollbar } from '../logging';
import { ExitCode } from './enums';
import { inMemoryBlobStorage } from './in-memory-blob-storage';
import { successfulInMemoryBroker } from './in-memory-brokers';
import {
  AdapterFactory,
  Analytics,
  BlobStorage,
  Broker,
  Cache,
  Disposable,
  Disposer,
  IdentifyUserOptions,
  NotificationsProvider,
  NotificationsProviderSchedulesReturn,
  Stats,
} from './interfaces';

const log = logger(import.meta);

/**
 * Map of disposable adapter instances
 */
const adapters = new Map<string, Disposable>();

/**
 * Maps ports to default adapters aka factory names to adapter keys or names
 */
const defaultAdapters = new Map<string, string>();

const InvalidKey = (key: string) => new Error(`Invalid adapter key: ${key}`);
const ExistingDefaultAdapter = (key: string) =>
  new Error(`Default adapter for ${key} port already exists`);

/**
 * Wraps creation of adapters around factory functions
 * @param factory adapter of T factory function
 * @returns adapter instance
 */
export function port<T extends Disposable>(factory: AdapterFactory<T>) {
  return function (
    options?:
      | {
          key: `${string}.${string}.${string}`;
          adapter?: never;
          isDefault?: never;
        }
      | {
          key?: never;
          adapter: T;
          isDefault?: never;
        }
      | {
          key: `${string}.${string}.${string}`;
          adapter: T;
          isDefault: boolean;
        },
  ) {
    // If no option use default adapter or set in-memory adapter as default
    if (!options) {
      const defaultAdapterKey = defaultAdapters.get(factory.name);
      if (defaultAdapterKey) return adapters.get(defaultAdapterKey) as T;

      const adapterInstance = factory();
      log.info(`[binding default adapter] ${adapterInstance.name}`);
      defaultAdapters.set(factory.name, adapterInstance.name);
      adapters.set(adapterInstance.name, adapterInstance);
      return adapterInstance as T;
    }

    // validate key at runtime to prevent confusing keys e.g.
    // key = 'S3' for R2 adapter.
    // skip key checks during tests to allow mocking adapters with specific keys
    if (options.key && config.NODE_ENV !== 'test') {
      const parts = options.key.split('.');
      if (parts.length !== 3) throw InvalidKey(options.key);
      if (parts[0] !== factory.name) throw InvalidKey(options.key);
      if (options.adapter && parts[1] !== options.adapter.name)
        throw InvalidKey(options.key);
    }

    // only key is given i.e. options = { key }
    // return adapter associated with given key or throw if not found
    if (options.key && !options.adapter && options.isDefault === undefined) {
      const adapterInstance = adapters.get(options.key);
      if (!adapterInstance)
        throw new Error(`Adapter ${options.key} not found!`);
      return adapterInstance as T;
    }

    // only adapter is given i.e. options = { adapter }
    // set adapter as default for port or throw if default already exists
    if (options.adapter && !options.key && options.isDefault === undefined) {
      if (defaultAdapters.has(factory.name))
        throw ExistingDefaultAdapter(factory.name);
      const adapterInstance = factory(options.adapter);
      defaultAdapters.set(factory.name, adapterInstance.name);
      adapters.set(adapterInstance.name, adapterInstance);
      return adapterInstance as T;
    }

    // all options provided i.e. options = { key, adapter, isDefault }
    // prevent default overrides but return existing adapter for key if
    // available instead of throwing
    if (options.key && options.adapter && options.isDefault !== undefined) {
      if (options.isDefault && defaultAdapters.has(factory.name)) {
        throw ExistingDefaultAdapter(factory.name);
      }

      const existingAdapter = adapters.get(options.key);
      if (existingAdapter) {
        log.warn(`Adapter with ${options.key} already exists`);
        return existingAdapter as T;
      }

      const adapterInstance = factory(options.adapter);
      if (options.isDefault) {
        defaultAdapters.set(factory.name, options.key);
        log.info(`[binding default adapter] ${options.key}`);
      } else log.info(`[binding adapter] ${options.key}`);

      adapters.set(options.key, adapterInstance);
      return adapterInstance as T;
    }

    throw new Error(`Adapter for the ${factory.name} port not found!`);
  };
}

/**
 * Register of resource disposers on exit
 */
const disposers: Disposer[] = [];

/**
 * Internal disposer and process killer
 * @param code exit code, defaults to unit testing
 * @param forceExit Forces exit in production if set to true
 */
const disposeAndExit = async (
  code: ExitCode = 'UNIT_TEST',
  forceExit: boolean = false,
): Promise<void> => {
  // don't kill process when errors are caught in production
  if (code === 'ERROR' && config.NODE_ENV === 'production') {
    if (forceExit) await new Promise((resolve) => setTimeout(resolve, 1_000));
    else return;
  }

  // call disposers
  await Promise.all(disposers.map((disposer) => disposer()));
  await Promise.all(
    [...adapters].reverse().map(async ([key, adapter]) => {
      log.info(`[disposing adapter] ${adapter.name || key}`);
      await adapter.dispose();
    }),
  );
  adapters.clear();
  defaultAdapters.clear();

  if (config.NODE_ENV !== 'test' && code !== 'UNIT_TEST') {
    rollbar.wait(() => {
      log.info('Rollbar logs flushed');
      // eslint-disable-next-line n/no-process-exit
      process.exit(code === 'ERROR' ? 1 : 0);
    });
  }
};

export const disposeAdapter = (name: string): void => {
  void adapters.get(name)?.dispose();
  adapters.clear();
  defaultAdapters.clear();
};

/**
 * Registers resource disposers that get triggered on process exits
 * @param disposer the disposer function
 * @returns a function that triggers all registered disposers and terminates the process
 */
export const dispose = (disposer?: Disposer): typeof disposeAndExit => {
  disposer && disposers.push(disposer);
  return disposeAndExit;
};

/**
 * Handlers to dispose registered resources on exit or unhandled exceptions
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.once('SIGINT', async (arg?: any) => {
  log.info(`SIGINT ${arg !== 'SIGINT' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.once('SIGTERM', async (arg?: any) => {
  log.info(`SIGTERM ${arg !== 'SIGTERM' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.once('uncaughtException', async (arg?: any) => {
  log.error('Uncaught Exception', arg);
  await disposeAndExit('ERROR');
});
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.once('unhandledRejection', async (arg?: any) => {
  log.error('Unhandled Rejection', arg);
  await disposeAndExit('ERROR');
});

/**
 * Stats port factory
 */
export const stats = port(function statsFactory(statsAdapter?: Stats) {
  return (
    statsAdapter || {
      name: 'in-memory-stats',
      dispose: () => Promise.resolve(),
      histogram: (key, value, tags) => {
        log.trace('stats.histogram', { key, value, tags });
      },
      set: () => {},
      increment: (key, tags) => {
        log.trace('stats.increment', { key, tags });
      },
      incrementBy: (key, value, tags) => {
        log.trace('stats.incrementBy', { key, value, tags });
      },
      decrement: (key, tags) => {
        log.trace('stats.decrement', { key, tags });
      },
      decrementBy: (key, value, tags) => {
        log.trace('stats.decrementBy', { key, value, tags });
      },
      on: (key) => {
        log.trace('stats.on', { key });
      },
      off: (key) => {
        log.trace('stats.off', { key });
      },
      gauge: (key, value) => {
        log.trace('stats.gauge', { key, value });
      },
      timing: (key, duration, time) => {
        log.trace('stats.timing', { key, duration, time });
      },
    }
  );
});

/**
 * Cache port factory
 */
export const cache = port(function cacheFactory(cacheAdapter?: Cache) {
  return (
    cacheAdapter || {
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
export const analytics = port(function analyticsFactory(
  analyticsAdapter?: Analytics,
) {
  return (
    analyticsAdapter || {
      name: 'in-memory-analytics',
      dispose: () => Promise.resolve(),
      track: (event, payload) => {
        log.trace('analytics.track', { event, payload });
      },
    }
  );
});

/**
 * Broker port factory
 */
export const broker = port(function brokerFactory(brokerAdapter?: Broker) {
  return brokerAdapter || successfulInMemoryBroker;
});

/**
 * External blob storage port factory
 */
export const blobStorage = port(function blobStorageFactory(
  blobStorageAdapter?: BlobStorage,
) {
  return blobStorageAdapter || inMemoryBlobStorage;
});

/**
 * Notifications provider port factory
 */
export const notificationsProvider = port(function notificationsProviderFactory(
  notificationsProviderAdapter?: NotificationsProvider,
) {
  return (
    notificationsProviderAdapter || {
      name: 'in-memory-notifications-provider',
      dispose: () => Promise.resolve(),
      triggerWorkflow: (options) => {
        log.info('triggerWorkflow', options);
        return Promise.resolve([
          { status: 'fulfilled', value: { workflow_run_id: '123' } },
        ]);
      },
      getMessages: () => Promise.resolve([]),
      getSchedules: () =>
        Promise.resolve([] as NotificationsProviderSchedulesReturn),
      createSchedules: () =>
        Promise.resolve([] as NotificationsProviderSchedulesReturn),
      deleteSchedules: ({ schedule_ids }) =>
        Promise.resolve(new Set(schedule_ids)),
      identifyUser: (options: IdentifyUserOptions) =>
        Promise.resolve({ id: options.user_id }),
      registerClientRegistrationToken: () => Promise.resolve(false),
      unregisterClientRegistrationToken: () => Promise.resolve(false),
    }
  );
});
