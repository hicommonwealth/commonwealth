import { cache, CacheNamespaces, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetTopHolders(): Query<typeof schemas.GetTopHolders> {
  return {
    ...schemas.GetTopHolders,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id, limit = 10, cursor = 1 } = payload;

      const top = await cache().sliceSortedSetWithScores(
        CacheNamespaces.TokenTopHolders,
        community_id,
        (cursor - 1) * limit,
        cursor * limit - 1,
        { order: 'ASC' },
      );

      // TODO: if we run out of ranked threads should we return something else
      if (!top.length)
        return {
          results: [],
          page: cursor,
          limit,
        };

      const sql = `
        WITH A AS (
          SELECT A.id, A.user_id, A.address, A.role
          FROM "Addresses" A
          WHERE A.community_id = :community_id AND A.id IN (:address_ids)
        )
        SELECT 
          U.id as user_id,
          A.address,
          U.profile->>'name' as name,
          U.profile->>'avatar_url' as avatar_url,
          A.role,
          U.tier
        FROM
          A JOIN "Users" U ON A.user_id = U.id
          ORDER BY ARRAY_POSITION(ARRAY[:address_ids], A.id);
      `;

      const holders = await models.sequelize.query<
        z.infer<typeof schemas.HolderView>
      >(sql, {
        replacements: {
          community_id,
          address_ids: top.map((t) => parseInt(t.value)),
        },
        type: QueryTypes.SELECT,
      });

      return {
        results: holders.map((h, index) => ({
          ...h,
          tokens: top[index].score,
          percentage: 0, // TODO: in UI?
        })),
        page: cursor,
        limit,
      };
    },
  };
}
