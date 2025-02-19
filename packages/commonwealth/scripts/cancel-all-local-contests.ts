/*

  Cancels all contests locally

*/

import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { exit } from 'process';
import { Op } from 'sequelize';

const log = logger(import.meta);

async function cancelAllLocalContests() {
  const { host } = await models.sequelize.config;
  if (host !== 'localhost') {
    throw new Error('script can only be run on localhost DB');
  }
  const [result] = await models.ContestManager.update(
    {
      cancelled: true,
    },
    {
      where: {
        cancelled: {
          [Op.ne]: true,
        },
        ended: {
          [Op.ne]: true,
        },
      },
    },
  );
  log.debug(`cancelled ${result} active contests`);
  exit(0);
}

cancelAllLocalContests().catch((err) => {
  console.error(err);
  exit(1);
});
