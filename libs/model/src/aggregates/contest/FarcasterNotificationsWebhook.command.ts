/* eslint-disable */
import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

// This webhook processes the farcaster notification events
export function FarcasterNotificationsWebhook(): Command<
  typeof schemas.FarcasterNotificationsWebhook
> {
  return {
    ...schemas.FarcasterNotificationsWebhook,
    auth: [],
    body: async () => {
      // console.log('NOTIFICATIONS EVENT PAYLOAD: ', payload);
      return {
        message: 'OK',
      };
    },
  };
}
