import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
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

      const mutualCommunities = await models.Community.findAll({
        where: {
          id: {
            [Op.in]: models.sequelize.literal(`(
              SELECT community_id 
              FROM "Addresses" 
              WHERE user_id = ${currentUserId}
              INTERSECT
              SELECT community_id 
              FROM "Addresses" 
              WHERE user_id = ${profileUserId}
            )`),
          },
        },
        attributes: ['id', 'name', 'base', 'icon_url'],
        limit,
      });

      return {
        mutual_communities: mutualCommunities.map((c) => ({
          id: c.id,
          name: c.name,
          base: c.base,
          icon_url: c.icon_url,
        })),
      };
    },
  };
}
