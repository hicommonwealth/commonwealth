import {
  logger,
  NotificationsProvider,
  NotificationsProviderGetMessagesOptions,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderScheduleRepeats,
  NotificationsProviderSchedulesReturn,
  NotificationsProviderTriggerOptions,
} from '@hicommonwealth/core';
import { Knock, Schedule } from '@knocklabs/node';
import { ScheduleRepeatProperties } from '@knocklabs/node/dist/src/resources/workflows/interfaces';
import { fileURLToPath } from 'url';
import { config } from '../config';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

function formatScheduleResponse(
  schedules: Schedule[],
): NotificationsProviderSchedulesReturn {
  return schedules.map((s) => ({
    id: s.id,
    actor: s.actor !== null ? s.actor : undefined,
    recipient: s.recipient,
    data: s.data,
    workflow: s.workflow,
    repeats: s.repeats as unknown as NotificationsProviderScheduleRepeats,
    last_occurrence_at: s.last_occurrence_at
      ? new Date(s.last_occurrence_at)
      : undefined,
    next_occurrence_at: s.next_occurrence_at
      ? new Date(s.next_occurrence_at)
      : undefined,
    inserted_at: s.inserted_at,
    updated_at: s.updated_at,
  }));
}

export function KnockProvider(): NotificationsProvider {
  const knock = new Knock(config.NOTIFICATIONS.KNOCK_SECRET_KEY);

  async function getExistingKnockTokensForUser(
    userId: number,
    channelId: string,
  ): Promise<ReadonlyArray<string>> {
    try {
      const channelData = await knock.users.getChannelData(
        `${userId}`,
        channelId,
      );
      return channelData.data.tokens;
    } catch (e) {
      // the knock SDK says it returns '404' if the user does not have channel
      // data but the typescript SDK doesn't provide the status so there's no
      // way to find out what type of error this is...
      log.error('Unable to fetch existing tokens: ', e as Error);
      return [];
    }
  }

  function computeChannelId(channelType: 'FCM' | 'APNS'): string | undefined {
    switch (channelType) {
      case 'FCM':
        return config.PUSH_NOTIFICATIONS.KNOCK_FCM_CHANNEL_ID;

      case 'APNS':
        return config.PUSH_NOTIFICATIONS.KNOCK_APNS_CHANNEL_ID;
    }
  }
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

    async getSchedules(options): Promise<NotificationsProviderSchedulesReturn> {
      const res = await knock.users.getSchedules(options.user_id, {
        // @ts-expect-error Knock SDK doesn't support this option, but it works since the Knock API supports it
        workflow: options.workflow_id,
      });
      return formatScheduleResponse(res.entries);
    },

    async createSchedules(options) {
      const res = await knock.workflows.createSchedules(options.workflow_id, {
        recipients: options.user_ids,
        repeats: options.schedule as unknown as ScheduleRepeatProperties[],
      });
      return formatScheduleResponse(res);
    },

    async deleteSchedules(options) {
      const res = await knock.workflows.deleteSchedules(options);
      return new Set(res.map((s) => s.id));
    },

    async registerClientRegistrationToken(
      userId: number,
      token: string,
      channelType: 'FCM' | 'APNS',
    ): Promise<boolean> {
      const channelId = computeChannelId(channelType);

      if (channelId) {
        const existingTokens = await getExistingKnockTokensForUser(
          userId,
          channelId,
        );
        const tokens: ReadonlyArray<string> = [token, ...existingTokens];

        await knock.users.setChannelData(`${userId}`, channelId, {
          tokens,
        });
        return true;
      } else {
        log.warn('Push notifications not enabled');
        return false;
      }
    },

    async unregisterClientRegistrationToken(
      userId: number,
      token: string,
      channelType: 'FCM' | 'APNS',
    ): Promise<boolean> {
      const channelId = computeChannelId(channelType);

      if (channelId) {
        const existingTokens = await getExistingKnockTokensForUser(
          userId,
          channelId,
        );

        const tokens: ReadonlyArray<string> = existingTokens.filter(
          (current) => current !== token,
        );

        await knock.users.setChannelData(`${userId}`, channelId, {
          tokens,
        });
        return true;
      } else {
        log.warn('Push notifications not enabled');
        return false;
      }
    },
  };
}
