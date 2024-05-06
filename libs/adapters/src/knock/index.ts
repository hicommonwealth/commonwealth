import {
  NotificationsProvider,
  NotificationsProviderOptions,
} from '@hicommonwealth/core';
import { Knock } from '@knocklabs/node';

export function KnockProvider(): NotificationsProvider {
  const knock = new Knock(process.env.KNOCK_API_KEY);

  return {
    name: 'KnockProvider',
    dispose: () => Promise.resolve(),
    async triggerWorkflow(
      options: NotificationsProviderOptions,
    ): Promise<boolean> {
      const runId = await knock.workflows.trigger(options.key, {
        recipients: options.users,
        data: options.data,
        actor: options.actor,
      });

      return !!runId;
    },
  };
}
