import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod/v4';
import { models } from '../../database';

export function GetQuests(): Query<typeof schemas.GetQuests> {
  return {
    ...schemas.GetQuests,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        search = '',
        community_id,
        cursor,
        limit,
        order_by,
        order_direction,
        end_before,
        end_after,
        start_before,
        start_after,
        include_system_quests,
        include_active_only,
      } = payload;

      const direction = order_direction || 'DESC';
      const order = order_by || 'created_at';
      const offset = limit! * (cursor! - 1);
      const now = new Date();
      const replacements = {
        search: search ? `%${search.toLowerCase()}%` : '',
        direction,
        community_id,
        order,
        limit,
        offset,
        end_before: end_before ? new Date(end_before) : null,
        start_after: start_after ? new Date(start_after) : null,
        start_before: start_before ? new Date(start_before) : null,
        end_after: end_after ? new Date(end_after) : null,
        now: include_active_only ? now : undefined,
      };
      const filterConditions = [
        include_system_quests ? '' : 'Q.id > 0',
        community_id ? `Q.community_id = :community_id` : '',
        start_after ? `Q.start_date > :start_after` : '',
        start_before ? `Q.start_date <= :start_before` : '',
        end_after ? `Q.end_date > :end_after` : '',
        end_before ? `Q.end_date <= :end_before` : '',
        search ? 'LOWER(Q.name) LIKE :search' : '',
        include_active_only
          ? 'Q.start_date <= :now AND Q.end_date >= :now'
          : '',
      ].filter(Boolean);

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
          Q.quest_type,
          count(*) OVER () AS total,
          CASE WHEN max(QAS.id) IS NOT NULL THEN
            json_agg(json_strip_nulls(json_build_object(
                'id', QAS.id,
                'quest_id', QAS.quest_id,
                'event_name', QAS.event_name,
                'reward_amount', QAS.reward_amount,
                'instructions_link', QAS.instructions_link,
                'creator_reward_weight', QAS.creator_reward_weight,
                'amount_multiplier', QAS.amount_multiplier,
                'content_id', QAS.content_id,
                'participation_limit', QAS.participation_limit,
                'participation_period', QAS.participation_period,
                'participation_times_per_period', QAS.participation_times_per_period,
                'created_at', QAS.created_at,
                'updated_at', QAS.updated_at,
                'CommunityGoalMeta', 
                  CASE 
                    WHEN CGM.id IS NOT NULL THEN json_build_object(
                      'id', CGM.id,
                      'name', CGM.name,
                      'description', CGM.description,
                      'type', CGM.type,
                      'target', CGM.target
                    )
                    ELSE NULL
                  END
            )))
          ELSE '[]'::json
          END AS "action_metas"
        FROM 
          "Quests" as Q
          LEFT JOIN "QuestActionMetas" QAS on QAS.quest_id = Q.id
          LEFT JOIN "CommunityGoalMetas" CGM on QAS.community_goal_meta_id = CGM.id
        ${filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : ''}
          GROUP BY Q.id, 
          Q.name,
          Q.description, 
          Q.image_url, 
          Q.community_id, 
          Q.start_date, 
          Q.end_date, 
          Q.updated_at, 
          Q.created_at,
          Q.quest_type
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
