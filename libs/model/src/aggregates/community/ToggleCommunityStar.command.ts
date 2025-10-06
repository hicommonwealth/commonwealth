import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function ToggleCommunityStar(): Command<
  typeof schemas.ToggleCommunityStar
> {
  return {
    ...schemas.ToggleCommunityStar,
    auth: [authRoles()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id } = payload;

      const [star, created] = await models.StarredCommunity.findOrCreate({
        where: { community_id, user_id: actor.user.id },
      });
      if (created) return true;

      await star.destroy();
      return false;
    },
  };
}
