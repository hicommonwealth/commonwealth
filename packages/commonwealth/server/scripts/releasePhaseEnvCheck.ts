import { logger } from '@hicommonwealth/core';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

async function releasePhaseEnvCheck() {
  try {
    await import('../config');
  } catch (e) {
    log.fatal('Environment variables not properly configured!', e);
    process.exit(1);
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  releasePhaseEnvCheck().then(() => {
    log.info('Environment variables are properly configured');
  });
}
