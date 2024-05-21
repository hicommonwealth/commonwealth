import {
  NotificationsProvider,
  NotificationsProviderOptions,
} from '@hicommonwealth/core';
import { Knock } from '@knocklabs/node';
import { config } from '../config';

export function KnockProvider(): NotificationsProvider {
  const knock = new Knock(config.NOTIFICATIONS.KNOCK_API_KEY);

  return {
    name: 'KnockProvider',
    dispose: () => Promise.resolve(),
    async triggerWorkflow(
      options: NotificationsProviderOptions,
    ): Promise<boolean> {
      const runId = await knock.workflows.trigger(options.key, {
        recipients: options.users,
        data: options.data,
        // TODO: disabled pending Knock support
        // actor: options.actor,
      });

      return !!runId;
    },
  };
}
