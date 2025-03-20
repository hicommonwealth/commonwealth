import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';
import { mustExist } from '../../middleware/guards';
import { handleSubscriptionPreferencesUpdate } from '../../utils/handleSubscriptionPreferencesUpdate';

export function UnsubscribeEmail(): Command<typeof schemas.UnsubscribeEmail> {
  return {
    ...schemas.UnsubscribeEmail,
    auth: [authVerified()],
    secure: false,
    body: async ({ payload }) => {
      const user = await models.User.findOne({
        where: { unsubscribe_uuid: payload.user_uuid },
      });
      mustExist('User', user);

      return await handleSubscriptionPreferencesUpdate({
        userIdentifier: user.id!,
        payload,
      });
    },
  };
}
