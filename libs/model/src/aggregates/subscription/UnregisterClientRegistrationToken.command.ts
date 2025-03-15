import { notificationsProvider, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { authVerified } from '../../middleware/auth';

export function UnregisterClientRegistrationToken(): Command<
  typeof schemas.UnregisterClientRegistrationToken
> {
  const notifications = notificationsProvider();
  return {
    ...schemas.UnregisterClientRegistrationToken,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      if (!actor.user.id) {
        throw new Error('No user id.');
      }

      await notifications.unregisterClientRegistrationToken(
        actor.user.id,
        payload.token,
        payload.channelType,
      );
      return {};
    },
  };
}
