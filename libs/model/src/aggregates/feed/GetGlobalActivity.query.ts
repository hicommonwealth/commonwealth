import { cache, CacheNamespaces, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authOptionalVerified } from '../../middleware';
import { buildGlobalActivityQuery } from '../../utils/getBaseActivityFeed';

export function GetGlobalActivity(): Query<typeof schemas.GlobalFeed> {
  return {
    ...schemas.GlobalFeed,
    auth: [authOptionalVerified],
    secure: true,
    body: async ({ actor, payload }) => {
      const {
        comment_limit = 3,
        limit = 10,
        cursor = 1,
        community_id,
        search,
      } = payload;

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

      const query = buildGlobalActivityQuery(actor, community_id, search);
      const threads = await models.sequelize.query<
        z.infer<typeof schemas.ThreadView>
      >(query, {
        type: QueryTypes.SELECT,
        replacements: {
          comment_limit,
          threadIds: rankedThreadIds.map((t) => parseInt(t)),
          ...(actor.address_id && { address_id: actor.address_id }),
          ...(actor.community_id && { community_id: actor.community_id }),
          ...(community_id && { community_id }),
          ...(search && { search: `%${search}%` }),
        },
      });

      return schemas.buildPaginatedResponse(threads, threads.length, {
        limit,
        cursor,
      });
    },
  };
}
