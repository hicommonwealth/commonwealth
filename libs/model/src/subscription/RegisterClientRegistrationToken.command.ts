import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      console.log('Registering client token!');
      // if (config.NOTIFICATIONS.FLAG_KNOCK_INTEGRATION_ENABLED) {
      //

      return {};
    },
  };
}
