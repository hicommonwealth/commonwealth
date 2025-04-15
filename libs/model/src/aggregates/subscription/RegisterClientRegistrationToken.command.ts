import { notificationsProvider, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { authVerified } from '../../middleware/auth';

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  const notifications = notificationsProvider();
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      if (!actor.user.id) {
        throw new Error('No user id.');
      }

      await notifications.registerClientRegistrationToken(
        actor.user.id,
        payload.token,
        payload.channelType,
      );
      return {};
    },
  };
}
