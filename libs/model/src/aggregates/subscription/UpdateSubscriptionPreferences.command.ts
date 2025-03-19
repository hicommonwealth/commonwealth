import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { authVerified } from '../../middleware/auth';
import { handleSubscriptionPreferencesUpdate } from '../../utils/handleSubscriptionPreferencesUpdate';

export function UpdateSubscriptionPreferences(): Command<
  typeof schemas.UpdateSubscriptionPreferences
> {
  return {
    ...schemas.UpdateSubscriptionPreferences,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      return await handleSubscriptionPreferencesUpdate({
        userIdentifier: Number(actor.user.id),
        payload,
      });
    },
  };
}
