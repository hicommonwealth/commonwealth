import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';

export function SearchUserProfiles(): Query<typeof schemas.SearchUserProfiles> {
  return {
    ...schemas.SearchUserProfiles,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { communityId, search, limit, page, orderBy, orderDirection } =
        payload;

      const { sql: paginationSort, bind: paginationBind } =
        schemas.buildPaginationSql({
          limit: Math.min(limit ?? 10, 100),
          page: page ?? 1,
          orderDirection,
          nullsLast: true,
          orderBy:
            orderBy === 'created_at'
              ? '"Users".created_at'
              : orderBy === 'profile_name'
                ? `"Users".profile->>'name'`
                : 'last_active',
        });
      const bind: any = {
        searchTerm: `%${search}%`,
        ...paginationBind,
      };
      if (communityId) bind.community_id = communityId;
      const where = `
        ${communityId ? `"Addresses".community_id = $community_id AND ` : ''}
        ("Users".profile->>'name' ILIKE $searchTerm)
      `;

      const sql = `
        WITH T AS (
          SELECT COUNT(DISTINCT "Users".id) AS total_count FROM "Users" WHERE ${where}
        )
        SELECT
          "Users".id AS user_id,
          "Users".profile->>'name' AS profile_name,
          "Users".profile->>'avatar_url' AS avatar_url,
          "Users".created_at,
          MAX("Addresses".last_active) as last_active,
          array_agg(
            json_build_object(
              'id', "Addresses".id,
              'community_id', "Addresses".community_id,
              'address', "Addresses".address,
              'role', "Addresses".role
            )
          ) as addresses,
          T.total_count
        FROM
          "Users"
          JOIN "Addresses" ON "Users".id = "Addresses".user_id 
          CROSS JOIN T
        WHERE ${where}
        GROUP BY
          "Users".id,
          T.total_count
        ${paginationSort}
      `;

      const profiles = await models.sequelize.query<
        z.infer<typeof schemas.SearchUserProfilesView> & { total_count: number }
      >(sql, {
        bind,
        type: QueryTypes.SELECT,
      });

      return schemas.buildPaginatedResponse(
        profiles,
        profiles?.length ? profiles[0].total_count : 0,
        bind,
      );
    },
  };
}
