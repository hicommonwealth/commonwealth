/*

  Cancels all contests locally

*/

import { command, config, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { CancelContestManagerMetadata } from 'node_modules/@hicommonwealth/model/src/contest';
import { systemActor } from 'node_modules/@hicommonwealth/model/src/middleware';
import { exit } from 'process';
import { Op } from 'sequelize';

const log = logger(import.meta);

async function cancelAllLocalContests() {
  const { host } = await models.sequelize.config;
  if (config.APP_ENV !== 'local' || host !== 'localhost') {
    throw new Error('script can only be run on localhost DB');
  }
  const activeContests = await models.ContestManager.findAll({
    where: {
      cancelled: {
        [Op.ne]: true,
      },
      ended: {
        [Op.ne]: true,
      },
    },
  });
  for (const contest of activeContests) {
    await command(CancelContestManagerMetadata(), {
      actor: systemActor({}),
      payload: {
        community_id: contest.community_id,
        contest_address: contest.contest_address,
      },
    });
  }
  log.debug(`cancelled ${activeContests.length} active contests`);
  exit(0);
}

cancelAllLocalContests().catch((err) => {
  console.error(err);
  exit(1);
});
