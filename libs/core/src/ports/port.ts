import { ExitCode } from './enums';
import { Disposable, Disposer } from './interfaces';

/**
 * Configured adapters map
 */
const adapters = new Map<string, Disposable>();

/**
 * Wraps creation of adapters around factory functions
 * @param target the factory function
 * @returns the adapter function
 */
export const port =
  <T extends Disposable>(target: (arg?: T) => T) =>
  (arg?: T): T => {
    if (!adapters.has(target.name)) {
      const adapter = target(arg);
      adapters.set(target.name, adapter);
      console.log(`✨${adapter.name || target.name}`);
    }
    return adapters.get(target.name) as T;
  };

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
      console.log(`♻️ ${adapter.name || key}`);
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
['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].map((e) => {
  process.once(e, async (arg?: any) => {
    console.log(`${e} ${arg !== e ? arg : ''}`);
    await disposeAndExit(
      ['uncaughtException', 'unhandledRejection'].includes(e)
        ? 'ERROR'
        : 'EXIT',
    );
  });
});
