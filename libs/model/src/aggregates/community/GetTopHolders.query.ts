import { type Query } from '@hicommonwealth/core';
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
      const { community_id, limit = 10 } = payload;

      const sql = `
        WITH token_group AS (
          SELECT g.id AS group_id
          FROM
            "LaunchpadTokens" lt
            JOIN "Communities" c ON c.namespace = lt.namespace
            JOIN "Groups" g ON g.community_id = c.id AND g.metadata->>'name' = lt.symbol || ' Holders'
            WHERE c.id = :community_id
          LIMIT 1
        )
        SELECT 
          u.id as user_id,
          a.address,
          u.profile->>'name' as name,
          u.profile->>'avatar_url' as avatar_url,
          0 as tokens,
          0 as percentage,
          a.role,
          u.tier
        FROM token_group tg
        JOIN "Memberships" m ON m.group_id = tg.group_id
        JOIN "Addresses" a ON m.address_id = a.id AND a.community_id = :community_id
        JOIN "Users" u ON a.user_id = u.id
        LIMIT :limit;
      `;

      const holders = await models.sequelize.query<
        z.infer<typeof schemas.HolderView>
      >(sql, {
        replacements: { community_id, limit },
        type: QueryTypes.SELECT,
      });

      return holders;
    },
  };
}
