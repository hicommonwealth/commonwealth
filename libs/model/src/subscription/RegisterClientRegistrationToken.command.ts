import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Knock } from '@knocklabs/node';

// FIXME: get the right secret key
const knockClient = new Knock('sk_12345');

// FIXME: ge tthe right channel ID
const CHANNEL_ID = '8209f26c-62a5-461d-95e2-a5716a26e652';

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      console.log('Registering client token!');
      // FIXME: verify that I can trust the actor and that it can't be faked
      await knockClient.users.setChannelData(`${actor.user.id}`, CHANNEL_ID, {
        tokens: [payload.token],
      });
      return {};
    },
  };
}
