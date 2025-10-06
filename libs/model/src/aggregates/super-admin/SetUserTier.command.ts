import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function SetUserTier(): Command<typeof schemas.SetUserTier> {
  return {
    ...schemas.SetUserTier,
    auth: [isSuperAdmin],
    body: async ({ actor, payload }) => {
      const { user_id, tier } = payload;

      if (
        user_id === actor.user.id &&
        (tier === UserTierMap.BannedUser || tier === UserTierMap.IncompleteUser)
      ) {
        throw new InvalidInput('Cannot ban yourself');
      }

      const user = await models.User.findByPk(user_id);
      if (!user) throw new InvalidInput('User not found');

      if (user.tier === tier) {
        return { success: true };
      }

      user.tier = tier;
      await user.save();

      return { success: true };
    },
  };
}
