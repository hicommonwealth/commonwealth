import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { shouldExist } from '../middleware/guards';

export function GetSubscriptionPreferences(): Query<
  typeof schemas.GetSubscriptionPreferences
> {
  return {
    ...schemas.GetSubscriptionPreferences,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      const subPreferences = await models.SubscriptionPreference.findOne({
        where: { user_id: actor.user.id },
      });

      if (!shouldExist('Subscription preferences', subPreferences)) {
        return {};
      }

      return subPreferences!.get({ plain: true });
    },
  };
}
