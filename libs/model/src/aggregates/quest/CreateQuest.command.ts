import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';
import { mustBeValidDateRange, mustNotExist } from '../../middleware/guards';
import { QuestInstance } from '../../models/quest';
import { getQuestXpLeaderboardViewName } from '../../utils';

async function createQuestMaterializedView(
  quest_id: number,
  transaction: Transaction,
) {
  const viewName = getQuestXpLeaderboardViewName(quest_id);
  await models.sequelize.query(
    `
    CREATE MATERIALIZED VIEW "${viewName}" AS
      WITH user_xp_combined AS (
          SELECT
              l.user_id as user_id,
              l.xp_points as xp_points,
              0 as creator_xp_points
          FROM "XpLogs" l
                   JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                   JOIN "Quests" q ON m.quest_id = q.id
          WHERE l.user_id IS NOT NULL AND q.id = ${quest_id}
      
          UNION ALL
      
          SELECT
              l.creator_user_id as user_id,
              0 as xp_points,
              l.creator_xp_points as creator_xp_points
          FROM "XpLogs" l
                   JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                   JOIN "Quests" q ON m.quest_id = q.id
          WHERE l.creator_user_id IS NOT NULL AND q.id = ${quest_id}
      ),
           aggregated_xp AS (
               SELECT
                   user_id,
                   quest_id,
                   SUM(xp_points)::int as total_user_xp,
                   SUM(creator_xp_points)::int as total_creator_xp
               FROM user_xp_combined
               GROUP BY user_id
           )
      SELECT
          a.user_id,
          (a.total_user_xp + a.total_creator_xp) as total_xp,
          u.tier,
          ROW_NUMBER() OVER (ORDER BY (a.total_user_xp + a.total_creator_xp) DESC, a.user_id ASC)::int as rank
      FROM aggregated_xp a
               JOIN "Users" u ON a.user_id = u.id
      WHERE u.tier > 1;
  `,
    { transaction },
  );

  await models.sequelize.query(
    `
    CREATE UNIQUE INDEX "${viewName}_user_id"
    ON "${viewName}" (user_id)
  `,
    { transaction },
  );

  await models.sequelize.query(
    `
    CREATE INDEX "${viewName}_rank"
    ON "${viewName}" (rank DESC);
  `,
    { transaction },
  );
}

export function CreateQuest(): Command<typeof schemas.CreateQuest> {
  return {
    ...schemas.CreateQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const {
        community_id,
        name,
        description,
        image_url,
        start_date,
        end_date,
        max_xp_to_end,
        quest_type,
      } = payload;

      const existingName = await models.Quest.findOne({
        where: { community_id: community_id ?? null, name },
        attributes: ['id'],
      });
      mustNotExist(
        `Quest named "${name}" in community "${community_id}"`,
        existingName,
      );

      mustBeValidDateRange(start_date, end_date);

      let quest: QuestInstance;
      await models.sequelize.transaction(async (transaction) => {
        quest = await models.Quest.create(
          {
            name,
            description,
            image_url,
            start_date,
            end_date,
            max_xp_to_end,
            xp_awarded: 0,
            community_id: community_id ?? null,
            quest_type,
          },
          { transaction },
        );
        await createQuestMaterializedView(quest.id!, transaction);
      });

      const jsonQuest = quest!.toJSON();
      delete jsonQuest.scheduled_job_id;
      return jsonQuest;
    },
  };
}
