import { notificationsProvider, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function UnregisterClientRegistrationToken(): Command<
  typeof schemas.UnregisterClientRegistrationToken
> {
  const notifications = notificationsProvider();
  return {
    ...schemas.UnregisterClientRegistrationToken,
    auth: [],
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
