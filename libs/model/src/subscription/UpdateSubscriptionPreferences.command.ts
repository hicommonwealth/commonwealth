import { EventNames, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { emitEvent } from '../';
import { models } from '../database';

function getDifferences(
  fullObject: Record<string, any>,
  subsetObject: Record<string, any>,
): Partial<z.infer<typeof SubscriptionPreference>> {
  const differences: Record<string, any> = {};
  for (const key in subsetObject) {
    if (key in subsetObject && subsetObject[key] !== fullObject[key]) {
      differences[key] = subsetObject[key];
    }
  }
  return differences;
}

export function UpdateSubscriptionPreferences(): Command<
  typeof schemas.UpdateSubscriptionPreferences
> {
  return {
    ...schemas.UpdateSubscriptionPreferences,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      const existingPreferences: z.infer<typeof SubscriptionPreference> | null =
        await models.SubscriptionPreference.findOne({
          where: {
            user_id: actor.user.id,
          },
          raw: true,
        });

      if (!existingPreferences) {
        throw new Error('Existing preferences not found');
      }

      const preferenceUpdates = getDifferences(existingPreferences, payload);
      if (!Object.keys(preferenceUpdates).length) {
        return existingPreferences;
      }

      let result;
      await models.sequelize.transaction(async (transaction) => {
        result = await models.SubscriptionPreference.update(payload, {
          where: {
            user_id: actor.user.id,
          },
          returning: true,
          transaction,
        });

        if (result[1].length !== 1)
          throw new Error('Failed to update subscription preferences');

        // for now only emit email preference updates
        if (
          'email_notifications_enabled' in preferenceUpdates ||
          'digest_email_enabled' in preferenceUpdates ||
          'recap_email_enabled' in preferenceUpdates
        ) {
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: EventNames.SubscriptionPreferencesUpdated,
                event_payload: {
                  id: existingPreferences.id,
                  user_id: existingPreferences.user_id,
                  ...preferenceUpdates,
                },
              },
            ],
            transaction,
          );
        }
      });

      return result![1][0].get({ plain: true });
    },
  };
}
