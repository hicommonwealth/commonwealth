import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';

const log = logger(import.meta);

export const refreshMaterializedViews = async (): Promise<void> => {
  log.info('Refreshing user_leaderboard view...');
  await models.sequelize.query(`
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard;
  `);
};

export const refreshMaterializedViewsTask = {
  input: TaskPayloads.RefreshMaterializedViews,
  fn: refreshMaterializedViews,
};
