import { dispose, logger } from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

if (import.meta.url.endsWith(process.argv[1])) {
  import('../config')
    .then(() => {
      // TODO: Add checks for unused env var
      // TODO: Add warning for manually set client FLAGs when APP_ENV !== 'local'/'CI'
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
