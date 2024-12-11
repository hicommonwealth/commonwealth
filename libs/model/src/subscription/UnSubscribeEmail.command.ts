import { type Command } from '@hicommonwealth/core';
import { emitEvent } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { SubscriptionPreference } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../database';

export function UnSubscribeEmail(): Command<typeof schemas.UnSubscribeEmail> {
  return {
    ...schemas.UnSubscribeEmail,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const verifyUser = await models.User.findOne({
        where: { unsubscribe_uuid: payload.id },
      });
      if (!verifyUser) {
        throw new Error('User not preferences not found');
      }
      const existingPreferences: z.infer<typeof SubscriptionPreference> | null =
        await models.SubscriptionPreference.findOne({
          where: {
            user_id: verifyUser.id,
          },
          raw: true,
        });

      if (!existingPreferences) {
        throw new Error('Existing preferences not found');
      }
      let result;
      await models.sequelize.transaction(async (transaction) => {
        result = await models.SubscriptionPreference.update(
          { email_notifications_enabled: payload.email_notifications_enabled },
          {
            where: {
              user_id: verifyUser.id,
            },
            returning: true,
            transaction,
          },
        );
        if (result[1].length !== 1)
          throw new Error('Failed to update subscription preferences');
        const preferenceUpdates = result![1][0].get({ plain: true });
        await emitEvent(
          models.Outbox,
          [
            {
              event_name: schemas.EventNames.UnSubscribeEmail,
              event_payload: {
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
