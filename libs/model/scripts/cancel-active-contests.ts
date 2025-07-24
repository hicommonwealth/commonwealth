/*
  Cancels all active contests locally
*/
import { config, logger } from '@hicommonwealth/core';
import { exit } from 'process';
import { Op } from 'sequelize';
import { models } from '../src/database';

const log = logger(import.meta);

async function cancelActiveContests() {
  const { host } = models.sequelize.config;
  if (config.APP_ENV !== 'local' || host !== 'localhost') {
    throw new Error('script can only be run on localhost DB');
  }
  const activeContests = await models.ContestManager.update(
    { cancelled: true },
    {
      where: {
        cancelled: { [Op.not]: true },
        ended: { [Op.not]: true },
      },
    },
  );
  log.debug(`Cancelled ${activeContests.length} active contests`);
  exit(0);
}

cancelActiveContests().catch((err) => {
  console.error(err);
  exit(1);
});
