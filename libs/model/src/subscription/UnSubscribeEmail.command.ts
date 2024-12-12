import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { handleSubscriptionPreferencesUpdate } from '../utils/handleSubscriptionPreferencesUpdate';

export function UnSubscribeEmail(): Command<typeof schemas.UnSubscribeEmail> {
  return {
    ...schemas.UnSubscribeEmail,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      return await handleSubscriptionPreferencesUpdate({
        userIdentifier: payload.id,
        isUnsubscribe: true,
        payload,
      });
    },
  };
}
