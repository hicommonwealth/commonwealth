import { InvalidState } from '@hicommonwealth/core';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { emitEvent } from './utils';

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

export async function handleSubscriptionPreferencesUpdate({
  userIdentifier,
  payload,
}: {
  userIdentifier: number;
  payload: Partial<z.infer<typeof SubscriptionPreference>>;
}) {
  const existingPreferences: z.infer<typeof SubscriptionPreference> | null =
    await models.SubscriptionPreference.findOne({
      where: {
        user_id: userIdentifier,
      },
      raw: true,
    });

  mustExist('existingPreferences', existingPreferences);

  const preferenceUpdates = getDifferences(existingPreferences, payload);
  if (!Object.keys(preferenceUpdates).length) {
    return existingPreferences;
  }
  let result;
  await models.sequelize.transaction(async (transaction) => {
    result = await models.SubscriptionPreference.update(payload, {
      where: { user_id: userIdentifier },
      returning: true,
      transaction,
    });
    if (result[1].length !== 1) {
      throw new InvalidState('Failed to update subscription preferences');
    }

    await emitEvent(
      models.Outbox,
      [
        {
          event_name: 'SubscriptionPreferencesUpdated',
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
}
