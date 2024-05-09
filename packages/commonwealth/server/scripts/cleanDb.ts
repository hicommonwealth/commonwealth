import { logger } from '@hicommonwealth/logging';
import { models } from '@hicommonwealth/model';
import { DatabaseCleaner } from 'commonwealth/server/util/databaseCleaner';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const databaseCleaner = new DatabaseCleaner();
databaseCleaner.init(models);
databaseCleaner
  .executeQueries()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    log.error(`Failed to clean the database.`, err);
  });
