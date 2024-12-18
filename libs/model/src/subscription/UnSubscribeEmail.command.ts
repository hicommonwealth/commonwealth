import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { handleSubscriptionPreferencesUpdate } from '../utils/handleSubscriptionPreferencesUpdate';

export function UnsubscribeEmail(): Command<typeof schemas.UnsubscribeEmail> {
  return {
    ...schemas.UnsubscribeEmail,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      return await handleSubscriptionPreferencesUpdate({
        userIdentifier: payload.user_uuid,
        isUnsubscribe: true,
        payload,
      });
    },
  };
}
