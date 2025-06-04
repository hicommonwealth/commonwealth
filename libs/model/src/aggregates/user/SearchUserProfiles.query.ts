import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ALL_COMMUNITIES, UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function SearchUserProfiles(): Query<typeof schemas.SearchUserProfiles> {
  return {
    ...schemas.SearchUserProfiles,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const {
        community_id,
        search,
        limit,
        cursor,
        order_by,
        order_direction,
        exact_match,
      } = payload;

      const communityFilter =
        community_id && community_id !== ALL_COMMUNITIES
          ? `AND A.community_id = :community_id`
          : '';
      const nameFilter =
        search.length > 0
          ? exact_match
            ? `AND U.profile->>'name' = :searchTerm`
            : `AND U.profile->>'name' ILIKE :searchTerm`
          : '';

      // pagination configuration
      const direction = order_direction || 'DESC';
      const order_col =
        order_by === 'created_at'
          ? 'U.created_at'
          : order_by === 'profile_name'
            ? `U.profile->>'name'`
            : 'last_active';
      const offset = limit! * (cursor! - 1);

      const sql = `
          SELECT U.id                         AS user_id,
                 U.profile ->> 'name'         AS profile_name,
                 U.profile ->> 'avatar_url'   AS avatar_url,
                 U.created_at,
                 MAX(A.last_active)           as last_active,
                 array_agg(
                         json_build_object(
                                 'id', A.id,
                                 'community_id', A.community_id,
                                 'address', A.address,
                                 'role', A.role
                         )
                 )                            as addresses,
                 COUNT(U.id) OVER ()::integer as total
          FROM "Users" U
                   JOIN "Addresses" A ON U.id = A.user_id
              WHERE U.tier > ${UserTierMap.BannedUser} 
              ${communityFilter}
              ${nameFilter}
          GROUP BY U.id
          ORDER BY ${order_col} ${direction}
          LIMIT :limit OFFSET :offset
      `;

      const profiles = await models.sequelize.query<
        z.infer<typeof schemas.SearchUserProfilesView> & { total: number }
      >(sql, {
        replacements: {
          searchTerm: exact_match ? search : `${search}%`,
          community_id,
          limit,
          offset,
        },
        type: QueryTypes.SELECT,
      });

      return schemas.buildPaginatedResponse(
        profiles,
        profiles.at(0)?.total ?? 0,
        { limit, offset },
      );
    },
  };
}
