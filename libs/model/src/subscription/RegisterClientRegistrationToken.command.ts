import { notificationsProvider, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function RegisterClientRegistrationToken(): Command<
  typeof schemas.RegisterClientRegistrationToken
> {
  const notifications = notificationsProvider();
  return {
    ...schemas.RegisterClientRegistrationToken,
    auth: [],
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
