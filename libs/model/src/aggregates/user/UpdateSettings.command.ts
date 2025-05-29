import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified, mustExist } from '../../middleware';

export function UpdateSettings(): Command<typeof schemas.UpdateSettings> {
  return {
    ...schemas.UpdateSettings,
    auth: [authVerified()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { disable_rich_text, enable_promotional_emails, email_interval } =
        payload;

      const user = await models.User.findOne({
        where: { id: actor.user.id },
      });
      mustExist('User', user);

      let updated = false;
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
      if (updated) await user.save();

      return updated;
    },
  };
}
