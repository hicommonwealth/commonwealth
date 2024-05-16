import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function UpdateSubscriptionPreferences(): Command<
  typeof schemas.UpdateSubscriptionPreferences
> {
  return {
    ...schemas.UpdateSubscriptionPreferences,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const { 1: rows } = await models.SubscriptionPreference.update(payload, {
        where: {
          user_id: actor.user.id,
        },
        returning: true,
      });

      if (rows.length !== 1)
        throw new Error('Failed to update subscription preferences');

      return rows[0].get({ plain: true });
    },
  };
}
