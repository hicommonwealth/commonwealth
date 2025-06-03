import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetMutualConnections(): Query<
  typeof schemas.GetMutualConnections
> {
  return {
    ...schemas.GetMutualConnections,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { user_id_1: currentUserId, user_id_2: profileUserId } = payload;

      const [currentUserCommunities, profileUserCommunities] =
        await Promise.all([
          models.Community.findAll({
            include: [
              {
                model: models.Address,
                where: { user_id: currentUserId },
                required: true,
                attributes: [],
              },
            ],
            attributes: ['id', 'name', 'base', 'icon_url'],
          }),
          models.Community.findAll({
            include: [
              {
                model: models.Address,
                where: { user_id: profileUserId },
                required: true,
                attributes: [],
              },
            ],
            attributes: ['id', 'name', 'base', 'icon_url'],
          }),
        ]);

      const mutualCommunityIds = currentUserCommunities
        .map((c) => c.id)
        .filter((id) => profileUserCommunities.some((c) => c.id === id));

      return {
        mutual_communities: currentUserCommunities
          .filter((c) => mutualCommunityIds.includes(c.id))
          .map((c) => ({
            id: c.id,
            name: c.name,
            base: c.base,
            icon_url: c.icon_url,
          })),
      };
    },
  };
}
