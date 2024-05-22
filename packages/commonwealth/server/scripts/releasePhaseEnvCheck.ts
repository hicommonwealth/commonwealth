import { logger } from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

if (import.meta.url.endsWith(process.argv[1])) {
  import('../config')
    .then(() => {
      log.info('Environment variables are properly configured');
      process.exit(0);
    })
    .catch((err) => {
      log.fatal('Environment variables not properly configured!', err);
      process.exit(1);
    });
}
