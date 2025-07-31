/*
  Cancels all active contests locally
*/
import { config, logger } from '@hicommonwealth/core';
import { exit } from 'process';
import { Op } from 'sequelize';
import { models } from '../src/database';

const log = logger(import.meta);

async function cancelActiveContests() {
  if (config.APP_ENV !== 'local') {
    throw new Error('Cannot cancel active contests in non-local environments');
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
