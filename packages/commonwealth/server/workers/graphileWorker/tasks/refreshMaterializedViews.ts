import { logger } from '@hicommonwealth/core';
import { getQuestXpLeaderboardViewName } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';
import { Op, literal } from 'sequelize';

const log = logger(import.meta);

export const refreshMaterializedViews = async (): Promise<void> => {
  log.info('Refreshing materialized views...');
  await models.sequelize.query(`
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard;
  `);

  const activeQuests = await models.Quest.findAll({
    attributes: ['id'],
    where: {
      start_date: {
        [Op.lte]: new Date(), // NOW() >= start_date
      },
      [Op.and]: [literal("NOW() <= end_date + INTERVAL '1 week'")],
    },
  });

  for (const { id } of activeQuests) {
    await models.sequelize.query(`
      REFRESH MATERIALIZED VIEW CONCURRENTLY ${getQuestXpLeaderboardViewName(id!)}
    `);
  }
};

export const refreshMaterializedViewsTask = {
  input: TaskPayloads.RefreshMaterializedViews,
  fn: refreshMaterializedViews,
};
