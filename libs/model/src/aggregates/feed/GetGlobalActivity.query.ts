import { cache, CacheNamespaces, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod/v4';
import { models } from '../../database';
import { filterGates, joinGates, withGates } from '../../utils/gating';
import { baseActivityQuery } from '../../utils/getUserActivityFeed';

export function GetGlobalActivity(): Query<typeof schemas.GlobalFeed> {
  return {
    ...schemas.GlobalFeed,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { comment_limit = 3, limit = 10, cursor = 1 } = payload;

      const rankedThreadIds = await cache().sliceSortedSet(
        CacheNamespaces.GlobalThreadRanks,
        'all',
        (cursor - 1) * limit,
        cursor * limit - 1,
        { order: 'ASC' },
      );

      // TODO: if we run out of ranked threads should we return something else
      if (!rankedThreadIds.length)
        return schemas.buildPaginatedResponse([], 0, {
          limit,
          cursor,
        });

      // TODO: add deleted_at, marked_as_spam_at and default community filters?
      const query = `
        ${withGates()},
        top_threads AS (
          SELECT
            T.*,
            count(*) OVER () AS total, C.icon_url
          FROM
            "Threads" T
            JOIN "Communities" C ON C.id = T.community_id
            ${joinGates()}
          WHERE
            T.id IN (:threadIds)
            ${filterGates()}
        )
        ${baseActivityQuery}
        ORDER BY ARRAY_POSITION(ARRAY[:threadIds], T.id);
      `;

      const threads = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView>
      >(query, {
        type: QueryTypes.SELECT,
        replacements: {
          comment_limit,
          threadIds: rankedThreadIds.map((t) => parseInt(t)),
        },
      });

      return schemas.buildPaginatedResponse(threads, threads.length, {
        limit,
        cursor,
      });
    },
  };
}
