import { factory, formatFilename } from '@hicommonwealth/core';
import { databaseCleaner } from 'commonwealth/server/util/databaseCleaner';
import models from '../database';

const log = factory.getLogger(formatFilename(__filename));
databaseCleaner.init(models);
databaseCleaner
  .executeQueries()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    log.error(`Failed to clean the database.`, err);
  });
