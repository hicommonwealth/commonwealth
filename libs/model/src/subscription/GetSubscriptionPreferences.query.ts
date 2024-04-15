import { schemas, type Query } from '@hicommonwealth/core';
import { models } from '../database';

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

    // We discussed throwing errors from here previously -> if not here then where can this be thrown?
    // It essentially should never happen except in the case of data corruption
    if (!subPreferences) throw new Error('Subscription preferences not found');

    return subPreferences.get({ plain: true });
  },
});
