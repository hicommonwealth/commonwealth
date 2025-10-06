import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import _ from 'lodash';
import { models } from '../../database';
import { authVerified, mustExist } from '../../middleware';
import { emitEvent } from '../../utils';

export function UpdateSettings(): Command<typeof schemas.UpdateSettings> {
  return {
    ...schemas.UpdateSettings,
    auth: [authVerified()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { disable_rich_text, enable_promotional_emails, email_interval } =
        payload;

      let updated = false;

      if (!disable_rich_text && !enable_promotional_emails && !email_interval) {
        return updated;
      }

      await models.sequelize.transaction(async (transaction) => {
        const user = await models.User.findOne({
          where: { id: actor.user.id },
          lock: transaction.LOCK.UPDATE,
        });
        mustExist('User', user);
        const oldUser = _.cloneDeep(user.toJSON());

        if (typeof disable_rich_text === 'boolean') {
          user.disableRichText = disable_rich_text;
          updated = true;
        }
        if (typeof enable_promotional_emails === 'boolean') {
          user.promotional_emails_enabled = enable_promotional_emails;
          updated = true;
        }
        if (email_interval) {
          user.emailNotificationInterval = email_interval;
          updated = true;
        }
        if (updated) {
          await user.save({ transaction });
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'UserUpdated',
                event_payload: {
                  new_user: user.toJSON(),
                  old_user: oldUser,
                },
              },
            ],
            transaction,
          );
        }
      });

      return updated;
    },
  };
}
