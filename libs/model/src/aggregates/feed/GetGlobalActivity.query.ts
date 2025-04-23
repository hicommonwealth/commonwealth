import { cache, CacheNamespaces, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { baseActivityQuery } from '../../utils/getUserActivityFeed';

export function GetGlobalActivity(): Query<typeof schemas.GlobalFeed> {
  return {
    ...schemas.GlobalFeed,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { comment_limit = 3, limit = 10, cursor = 1 } = payload;

      const rankedThreadIds = await cache().sliceSortedSetWithScores(
        CacheNamespaces.GlobalThreadRanks,
        '',
        (cursor - 1) * limit,
        cursor * limit - 1,
        { order: 'ASC' },
      );

      // TODO: if we run out of ranked threads should we return something else
      if (!rankedThreadIds.length)
        return {
          results: [],
          page: cursor,
          limit,
        };

      // TODO: add deleted_at, marked_as_spam_at and default community filters?
      const query = `
        WITH top_threads AS (
        SELECT T.*, count(*) OVER () AS total, C.icon_url
        FROM "Threads" T
        JOIN "Communities" C ON C.id = T.community_id
        WHERE T.id IN (:threadIds)
      )
        ${baseActivityQuery}
        ORDER BY ARRAY_POSITION(:threadIds, T.id);
      `;

      const threads = await models.sequelize.query<
        z.infer<typeof schemas.ActivityThread>
      >(query, {
        type: QueryTypes.SELECT,
        replacements: {
          comment_limit,
          threadIds: rankedThreadIds,
        },
      });

      return {
        results: threads,
        page: cursor,
        limit,
      };
    },
  };
}
