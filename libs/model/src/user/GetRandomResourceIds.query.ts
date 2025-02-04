import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function GetRandomResourceIds(): Query<
  typeof schemas.GetRandomResourceIds
> {
  return {
    ...schemas.GetRandomResourceIds,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { exclude_joined_communities, cursor, limit } = payload;

      const sql = `
        ${
          exclude_joined_communities
            ? 'WITH UserJoinedCommunities AS (SELECT community_id as id FROM "Addresses" where user_id = :user_id)'
            : ''
        }
        SELECT 
          C.id as community_id, 
          T.id as thread_id, 
          COM.id as comment_id,
          COUNT(*) OVER() AS total_count
        FROM "Communities" C
          LEFT JOIN "Threads" T ON T.community_id = C.id
          LEFT JOIN "Comments" COM ON T.id = COM.thread_id
        WHERE 
          C.active IS true 
          AND C.lifetime_thread_count > 0
          AND T.id IS NOT NULL
          AND COM.id IS NOT NULL
          AND T.deleted_at IS NULL
          AND COM.deleted_at IS NULL
          AND T.marked_as_spam_at IS NULL
          AND COM.marked_as_spam_at IS NULL
          ${exclude_joined_communities ? 'AND C.id NOT IN (SELECT id FROM UserJoinedCommunities)' : ''}
        ORDER BY random()
        LIMIT :limit;
      `;

      const offset = (cursor - 1) * limit;

      const randomResourceIds = await models.sequelize.query<
        z.infer<typeof schemas.RandomResourceIdsView> & {
          total_count: number;
        }
      >(sql, {
        replacements: {
          limit,
          offset,
          user_id: actor.user.id,
        },
        type: QueryTypes.SELECT,
      });

      const sanitizedRandomResourceIds = randomResourceIds.map((x) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total_count, ...rest } = x;
        return rest;
      });

      return schemas.buildPaginatedResponse(
        sanitizedRandomResourceIds,
        randomResourceIds?.length
          ? parseInt(`${randomResourceIds!.at(0)!.total_count}`)
          : 0,
        { ...payload, offset },
      );
    },
  };
}
