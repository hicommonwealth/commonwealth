import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

export function GetMutualConnections(): Query<
  typeof schemas.GetMutualConnections
> {
  return {
    ...schemas.GetMutualConnections,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const {
        user_id_1: currentUserId,
        user_id_2: profileUserId,
        limit,
      } = payload;

      const mutual_communities = await models.sequelize.query<
        z.infer<typeof schemas.MutualCommunityView>
      >(
        `SELECT c.id, c.name, c.base, c.icon_url
         FROM "Communities" c
         WHERE c.id IN (
           SELECT community_id 
           FROM "Addresses" 
           WHERE user_id = :currentUserId
           INTERSECT
           SELECT community_id 
           FROM "Addresses" 
           WHERE user_id = :profileUserId
         )
         LIMIT :limit`,
        {
          replacements: { currentUserId, profileUserId, limit },
          type: QueryTypes.SELECT,
        },
      );

      return {
        mutual_communities,
      };
    },
  };
}
