import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { DatabaseCleaner } from '../util/databaseCleaner';

const log = logger().getLogger(__filename);
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
