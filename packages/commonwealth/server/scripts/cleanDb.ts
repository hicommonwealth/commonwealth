import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { DatabaseCleaner } from '../util/databaseCleaner';

const log = logger(import.meta);
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
