import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Knock } from '@knocklabs/node';

process.env.KNOCK_SIGNING_KEY = '...=';
const knockClient = new Knock(process.env.KNOCK_PRIVATE_KEY);

// BadRequestException {
//   code: 'channel_invalid',
//     message: 'A channel_invalid error occurred: The channel you supplied is invalid for this request',
//     requestID: 'F9Hyp6Wd0Y43lI0DWz8C',
//     status: 400,
//     name: 'BadRequestException'
// }

const CHANNEL_ID = process.env.KNOCK_FCM_CHANNEL_ID;

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      console.log('Registering client token!');

      if (!CHANNEL_ID) {
        return;
      }

      // FIXME: verify that I can trust the actor and that it can't be faked
      try {
        await knockClient.users.setChannelData(`${actor.user.id}`, CHANNEL_ID, {
          tokens: [payload.token],
        });
      } catch (e) {
        console.error(e);
      }
      return {};
    },
  };
}
