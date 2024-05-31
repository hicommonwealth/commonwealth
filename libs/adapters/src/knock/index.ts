import {
  NotificationsProvider,
  NotificationsProviderGetMessagesOptions,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderTriggerOptions,
} from '@hicommonwealth/core';
import { Knock } from '@knocklabs/node';
import { config } from '../config';

export function KnockProvider(): NotificationsProvider {
  const knock = new Knock(config.NOTIFICATIONS.KNOCK_SECRET_KEY);

  return {
    name: 'KnockProvider',
    dispose: () => Promise.resolve(),
    async triggerWorkflow(
      options: NotificationsProviderTriggerOptions,
    ): Promise<boolean> {
      const runId = await knock.workflows.trigger(options.key, {
        recipients: options.users,
        data: options.data,
        // TODO: disabled pending Knock support - UPDATE: PR merged in Knock SDK repo but await new release
        // actor: options.actor,
      });

      return !!runId;
    },
    async getMessages(
      options: NotificationsProviderGetMessagesOptions,
    ): Promise<NotificationsProviderGetMessagesReturn> {
      const res = await knock.users.getMessages(options.user_id, {
        page_size: options.page_size,
        channel_id: options.channel_id,
        after: options.cursor,
      });

      return res.items;
    },
    async registerClientRegistrationToken(
      userId: number,
      token: string,
    ): Promise<boolean> {
      if (config.PUSH_NOTIFICATIONS.KNOCK_FCM_CHANNEL_ID) {
        await knock.users.setChannelData(
          `${userId}`,
          config.PUSH_NOTIFICATIONS.KNOCK_FCM_CHANNEL_ID,
          {
            tokens: [token],
          },
        );
        return true;
      } else {
        console.warn('Push notifications not enabled');
        return false;
      }
    },
  };
}
