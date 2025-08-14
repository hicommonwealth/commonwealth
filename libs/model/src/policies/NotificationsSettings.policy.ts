import {
  notificationsProvider,
  Policy,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { models } from '../database';
import { processSubscriptionPreferencesUpdated } from '../services/knock/subscriptionPreferencesUpdated';
import { mapDateToDaysOfWeek } from '../services/knock/util';

const notificationSettingsInputs = {
  SubscriptionPreferencesUpdated: events.SubscriptionPreferencesUpdated,
  UserCreated: events.UserCreated,
  UserUpdated: events.UserUpdated,
};

export function NotificationsSettingsPolicy(): Policy<
  typeof notificationSettingsInputs
> {
  return {
    inputs: notificationSettingsInputs,
    body: {
      SubscriptionPreferencesUpdated: async (event) => {
        await processSubscriptionPreferencesUpdated(event);
      },
      UserCreated: async ({ payload }) => {
        if (payload.user.email) {
          await notificationsProvider().identifyUser({
            user_id: `${payload.user_id}`,
            user_properties: {
              email: payload.user.email,
            },
          });
        }
      },
      UserUpdated: async ({ payload }) => {
        const oldEmail = payload.old_user.email;
        const newEmail = payload.new_user.email;
        if (newEmail && newEmail !== oldEmail) {
          await notificationsProvider().identifyUser({
            user_id: `${payload.new_user.id!}`,
            user_properties: {
              email: newEmail,
            },
          });
        }

        /**
         * Email Notification Interval Update Handling
         */

        const subPref = await models.SubscriptionPreference.findOne({
          where: {
            user_id: payload.new_user.id!,
          },
        });

        // Nothing to update if emails are disabled
        if (
          !subPref ||
          !subPref.email_notifications_enabled ||
          (!subPref.digest_email_enabled && !subPref.recap_email_enabled)
        )
          return;

        const oldInterval = payload.old_user.emailNotificationInterval;
        const newInterval = payload.new_user.emailNotificationInterval;
        // No change in interval
        if (!newInterval || oldInterval === newInterval) return;

        const existingSchedules = await notificationsProvider().getSchedules({
          user_id: String(payload.new_user.id),
        });

        // delete existing schedules if emails are disabled
        if (newInterval === 'never' && existingSchedules.length > 0) {
          await notificationsProvider().deleteSchedules({
            schedule_ids: existingSchedules
              .filter((s) =>
                [WorkflowKeys.EmailRecap, WorkflowKeys.EmailDigest].includes(
                  s.workflow as WorkflowKeys,
                ),
              )
              .map((s) => s.id),
          });
          return;
        }
        // No schedules to update or create
        if (newInterval === 'never') return;

        // Update existing schedules if emails are enabled
        const scheduleIdsToUpdate = existingSchedules
          .filter((s) => {
            if (
              s.workflow === WorkflowKeys.EmailRecap &&
              subPref.recap_email_enabled
            ) {
              return true;
            } else if (
              s.workflow === WorkflowKeys.EmailDigest &&
              subPref.digest_email_enabled
            ) {
              return true;
            }
            return false;
          })
          .map((s) => s.id);
        if (scheduleIdsToUpdate.length > 0) {
          await notificationsProvider().updateSchedules({
            schedule_ids: scheduleIdsToUpdate,
            schedule: scheduleIdsToUpdate.map(() => ({
              frequency: newInterval,
              days: [mapDateToDaysOfWeek(new Date())],
              hours: 12,
            })),
          });
        }

        // Create new schedules only for emails that are enabled
        const workflowsToCreate: WorkflowKeys[] = [];
        if (subPref.recap_email_enabled) {
          workflowsToCreate.push(WorkflowKeys.EmailRecap);
        }
        if (subPref.digest_email_enabled) {
          workflowsToCreate.push(WorkflowKeys.EmailDigest);
        }
        if (workflowsToCreate.length === 0) return;

        // Create new schedules for emails that are enabled but do not have an existing schedule
        const scheduleIdsToCreate = Array.from(
          new Set(workflowsToCreate).difference(
            new Set(existingSchedules.map((s) => s.workflow)),
          ),
        );

        if (scheduleIdsToCreate.length > 0) {
          for (const workflow of scheduleIdsToCreate) {
            await notificationsProvider().createSchedules({
              user_ids: [`${payload.new_user.id!}`],
              workflow_id: workflow,
              schedule: [
                {
                  frequency: newInterval,
                  days: [mapDateToDaysOfWeek(new Date())],
                  hours: 12,
                },
              ],
            });
          }
        }
      },
    },
  };
}
