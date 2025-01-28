import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetQuests(): Query<typeof schemas.GetQuests> {
  return {
    ...schemas.GetQuests,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, cursor, limit, order_by, order_direction } =
        payload;

      const direction = order_direction || 'DESC';
      const order = order_by || 'created_at';
      const offset = limit! * (cursor! - 1);
      const replacements = { direction, community_id, order, limit, offset };

      const sql = `
        SELECT 
          Q.id, 
          Q.name,
          Q.description, 
          Q.image_url, 
          Q.community_id, 
          Q.start_date, 
          Q.end_date, 
          Q.updated_at, 
          Q.created_at,
          count(*) OVER () AS total,
          CASE WHEN max(QAS.id) IS NOT NULL THEN
            json_agg(json_strip_nulls(json_build_object(
                'id', QAS.id,
                'quest_id', QAS.quest_id,
                'event_name', QAS.event_name,
                'reward_amount', QAS.reward_amount,
                'creator_reward_weight', QAS.creator_reward_weight,
                'participation_limit', QAS.participation_limit,
                'participation_period', QAS.participation_period,
                'participation_times_per_period', QAS.participation_times_per_period,
                'created_at', QAS.created_at,
                'updated_at', QAS.updated_at
            )))
          ELSE '[]'::json
          END AS "action_metas"
        FROM 
          "Quests" as Q
        LEFT JOIN "QuestActionMetas" QAS on QAS.quest_id = Q.id
        GROUP BY Q.id
        ORDER BY Q.${order} ${direction}
        LIMIT :limit OFFSET :offset
      `;

      const quests = await models.sequelize.query<
        z.infer<typeof schemas.QuestView> & {
          total?: number;
          community_id: string;
        }
      >(sql, {
        replacements,
        type: QueryTypes.SELECT,
        nest: true,
      });

      return schemas.buildPaginatedResponse(
        quests,
        +(quests.at(0)?.total ?? 0),
        {
          limit,
          offset,
        },
      );
    },
  };
}
