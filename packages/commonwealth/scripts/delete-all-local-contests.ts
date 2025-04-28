/*

  Cancels all contests locally

*/

import { config, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { exit } from 'process';

const log = logger(import.meta);

async function deleteAllLocalContests() {
  const { host } = models.sequelize.config;
  if (config.APP_ENV !== 'local' || host !== 'localhost') {
    throw new Error('script can only be run on localhost DB');
  }
  await models.ContestAction.destroy({ truncate: true, cascade: true });
  await models.Contest.destroy({ truncate: true, cascade: true });
  await models.ContestManager.destroy({ truncate: true, cascade: true });
  log.debug('Deleted all local contests');
}

deleteAllLocalContests().catch((err) => {
  console.error(err);
  exit(1);
});
