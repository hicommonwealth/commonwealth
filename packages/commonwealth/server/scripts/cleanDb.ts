import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { databaseCleaner } from 'commonwealth/server/util/databaseCleaner';
import models from '../database';

const log = loggerFactory.getLogger(formatFilename(__filename));
databaseCleaner.init(models);
databaseCleaner
  .executeQueries()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    log.error(`Failed to clean the database.`, err);
  });
