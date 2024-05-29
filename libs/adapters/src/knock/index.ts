import {
  NotificationsProvider,
  NotificationsProviderGetMessagesOptions,
  NotificationsProviderGetMessagesReturn,
  NotificationsProviderScheduleRepeats,
  NotificationsProviderSchedulesReturn,
  NotificationsProviderTriggerOptions,
} from '@hicommonwealth/core';
import { Knock, Schedule } from '@knocklabs/node';
import { ScheduleRepeatProperties } from '@knocklabs/node/dist/src/resources/workflows/interfaces';
import { config } from '../config';

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
        // TODO: Knock SDK doesn't have type support for this option but it technically works since
        //  the Knock API supports it
        // @ts-expect-error
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
  };
}
