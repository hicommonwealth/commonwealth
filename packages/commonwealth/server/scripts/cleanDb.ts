import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
import { DatabaseCleaner } from '../util/databaseCleaner';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const databaseCleaner = new DatabaseCleaner();
databaseCleaner.init(models);
databaseCleaner
  .executeQueries()
  .then(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  })
  .catch((err) => {
    log.error(`Failed to clean the database.`, err);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispose()('EXIT', true);
  });
