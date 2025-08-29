import { logger } from '@hicommonwealth/core';
import { getQuestXpLeaderboardViewName } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';
import Sequelize from 'sequelize';

const log = logger(import.meta);

export const refreshMaterializedViews = async (): Promise<void> => {
  log.info('Refreshing materialized views...');
  await models.sequelize.query(`
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard;
  `);

  const activeQuests = await models.sequelize.query<{ id: number }>(
    `
    SELECT id
    FROM "Quests"
    WHERE start_date <= NOW()
      AND NOW() <= end_date + INTERVAL '1 week';
  `,
    {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
    },
  );

  for (const { id } of activeQuests) {
    await models.sequelize.query(`
      REFRESH MATERIALIZED VIEW CONCURRENTLY "${getQuestXpLeaderboardViewName(id!)}"
    `);
  }
};

export const refreshMaterializedViewsTask = {
  input: TaskPayloads.RefreshMaterializedViews,
  fn: refreshMaterializedViews,
};
