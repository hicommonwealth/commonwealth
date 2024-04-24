import { schemas, type Query } from '@hicommonwealth/core';
import { models } from '../database';
import { shouldExist } from '../middleware/guards';

export const GetSubscriptionPreferences: Query<
  typeof schemas.queries.GetSubscriptionPreferences
> = () => ({
  ...schemas.queries.GetSubscriptionPreferences,
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
});
