import { type Command } from '@hicommonwealth/core';
import { emitEvent } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';

function getDifferences(
  fullObject: Record<string, unknown>,
  subsetObject: Record<string, unknown>,
): Partial<z.infer<typeof SubscriptionPreference>> {
  const differences: Record<string, unknown> = {};
  for (const key in subsetObject) {
    if (
      key !== 'id' &&
      key in subsetObject &&
      subsetObject[key] !== fullObject[key]
    ) {
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

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: schemas.EventNames.SubscriptionPreferencesUpdated,
              event_payload: {
                user_id: existingPreferences.user_id,
                ...preferenceUpdates,
              },
            },
          ],
          transaction,
        );
      });

      return result![1][0].get({ plain: true });
    },
  };
}
