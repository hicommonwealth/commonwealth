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
          Q.community_id, 
          Q.start_date, 
          Q.end_date, 
          Q.updated_at, 
          Q.created_at,
          count(*) OVER () AS total
        FROM 
          "Quests" as Q
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
