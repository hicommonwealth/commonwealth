import { Logger } from './interfaces';
import { port } from './port';

export * from './enums';
export * from './interfaces';

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
