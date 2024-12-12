import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { handleSubscriptionPreferencesUpdate } from '../utils/handleSubscriptionPreferencesUpdate';

export function UpdateSubscriptionPreferences(): Command<
  typeof schemas.UpdateSubscriptionPreferences
> {
  return {
    ...schemas.UpdateSubscriptionPreferences,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      return await handleSubscriptionPreferencesUpdate({
        userIdentifier: Number(actor.user.id),
        isUnsubscribe: false,
        payload,
      });
    },
  };
}
