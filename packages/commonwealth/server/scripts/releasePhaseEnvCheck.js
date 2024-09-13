import { dispose, logger } from '@hicommonwealth/core';

const log = logger(import.meta);

if (import.meta.url.endsWith(process.argv[1])) {
  import('../config')
    .then(() => {
      // TODO: Add checks for unused env var
      // TODO: Add warning for manually set client FLAGs when APP_ENV !== 'local'/'CI'
      log.info('Environment variables are properly configured');
      dispose()('EXIT', true);
    })
    .catch((err) => {
      log.fatal('Environment variables not properly configured!', err);
      dispose()('ERROR', true);
    });
}
