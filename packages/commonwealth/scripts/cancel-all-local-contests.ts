/*

  Cancels all contests locally

*/

import { logger } from '@hicommonwealth/core';
import { exit } from 'process';

const log = logger(import.meta);

async function cancelAllLocalContests() {
  // const { host } = models.sequelize.config;
  // if (config.APP_ENV !== 'local' || host !== 'localhost') {
  //   throw new Error('script can only be run on localhost DB');
  // }
  // const activeContests = await models.ContestManager.update(
  //   {
  //     cancelled: true,
  //   },
  //   {
  //     where: {
  //       cancelled: {
  //         [Op.not]: true,
  //       },
  //       ended: {
  //         [Op.not]: true,
  //       },
  //     },
  //   },
  // );
  // log.debug(`cancelled ${activeContests.length} active contests`);
  exit(0);
}

cancelAllLocalContests().catch((err) => {
  console.error(err);
  exit(1);
});
