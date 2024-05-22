import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [],
    secure: true,
    body: async (req) => {
      console.log('Registering client token!');
    },
  };
}
