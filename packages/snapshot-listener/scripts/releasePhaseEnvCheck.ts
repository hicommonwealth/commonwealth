import { dispose, logger } from '@hicommonwealth/core';

const log = logger(import.meta);

if (import.meta.url.endsWith(process.argv[1])) {
  import('../src/config')
    .then(() => {
      log.info('Environment variables are properly configured');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      log.fatal('Environment variables not properly configured!', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
