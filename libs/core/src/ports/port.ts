import { ExitCode } from './enums';
import { AdapterFactory, Disposable, Disposer } from './interfaces';

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
      console.log('[binding adapter]', instance.name || factory.name);
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
  await Promise.all(disposers.map((disposer) => disposer()));
  await Promise.all(
    [...adapters].map(async ([key, adapter]) => {
      console.log('[disposing adapter]', adapter.name || key);
      await adapter.dispose();
    }),
  );
  adapters.clear();
  code !== 'UNIT_TEST' && process.exit(code === 'ERROR' ? 1 : 0);
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
  console.log(`SIGINT ${arg !== 'SIGINT' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
process.once('SIGTERM', async (arg?: any) => {
  console.log(`SIGTERM ${arg !== 'SIGTERM' ? arg : ''}`);
  await disposeAndExit('EXIT');
});
process.once('uncaughtException', async (arg?: any) => {
  console.log(`uncaughtException ${arg}`);
  await disposeAndExit('ERROR');
});
process.once('unhandledRejection', async (arg?: any) => {
  console.log(`unhandledRejection ${arg}`);
  await disposeAndExit('ERROR');
});
