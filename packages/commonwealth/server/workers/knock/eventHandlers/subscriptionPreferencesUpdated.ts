import {
  EventHandler,
  logger,
  notificationsProvider,
  RepeatFrequency,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models, SubscriptionPreferenceInstance } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';
import { DaysOfWeek } from '@knocklabs/node';
import z from 'zod';
import { config } from '../../../config';

const log = logger(import.meta);

const output = z.boolean();

function mapDateToDaysOfWeek(
  date: Date,
): (typeof DaysOfWeek)[keyof typeof DaysOfWeek] {
  switch (date.getDay()) {
    case 0:
      return DaysOfWeek.Sun;
    case 1:
      return DaysOfWeek.Mon;
    case 2:
      return DaysOfWeek.Tue;
    case 3:
      return DaysOfWeek.Wed;
    case 4:
      return DaysOfWeek.Thu;
    case 5:
      return DaysOfWeek.Fri;
    default:
      return DaysOfWeek.Sat;
  }
}

async function createScheduleIfNotExists(
  workflowKey: WorkflowKeys.EmailRecap | WorkflowKeys.EmailDigest,
  userId: string,
): Promise<boolean> {
  const provider = notificationsProvider();

  const existingSchedules = await provider.getSchedules({
    user_id: userId,
    workflow_id: workflowKey,
  });

  if (existingSchedules.length === 0) {
    await provider.createSchedules({
      user_ids: [userId],
      workflow_id: workflowKey,
      schedule: [
        {
          frequency: RepeatFrequency.Weekly,
          days: [mapDateToDaysOfWeek(new Date())],
          hours: 12,
        },
      ],
    });
    return true;
  } else if (existingSchedules.length > 1) {
    log.error(
      `User ${userId} has more than 1 scheduled ${workflowKey} workflow run`,
      undefined,
      {
        userId,
        workflowKey,
        existingSchedules,
      },
    );
    return false;
  }

  return true;
}

async function deleteScheduleIfExists(
  workflowKey: WorkflowKeys.EmailRecap | WorkflowKeys.EmailDigest,
  userId: string,
): Promise<boolean> {
  const provider = notificationsProvider();

  const existingSchedules = await provider.getSchedules({
    user_id: userId,
    workflow_id: workflowKey,
  });

  if (existingSchedules.length === 0) return true;

  await provider.deleteSchedules({
    schedule_ids: existingSchedules.map((s) => s.id),
  });

  return true;
}

async function handleEmailPreferenceUpdates(
  payload: z.infer<typeof events.SubscriptionPreferencesUpdated>,
  subscriptionPreferences: SubscriptionPreferenceInstance,
) {
  if (
    !('email_notifications_enabled' in payload) &&
    !('recap_email_enabled' in payload) &&
    !('digest_email_enabled' in payload)
  )
    return;

  // Remove email schedules -> all emails disabled
  if (payload.email_notifications_enabled === false) {
    const provider = notificationsProvider();
    const existingSchedules = await provider.getSchedules({
      user_id: String(payload.user_id),
    });
    const ids = existingSchedules
      .filter(
        (s) =>
          s.workflow === WorkflowKeys.EmailDigest ||
          s.workflow === WorkflowKeys.EmailRecap,
      )
      .map((s) => s.id);

    if (ids.length) {
      const deletedSchedules = await provider.deleteSchedules({
        schedule_ids: ids,
      });
      const allDeleted = ids.every((id) => deletedSchedules.has(id));
      if (!allDeleted) {
        throw new Error('Failed to delete schedules');
      }
    }
    return;
  }

  // Add email schedules if a new email type is enabled
  if (subscriptionPreferences.email_notifications_enabled === true) {
    if (payload.recap_email_enabled === true) {
      await createScheduleIfNotExists(
        WorkflowKeys.EmailRecap,
        String(payload.user_id),
      );
    }

    if (payload.digest_email_enabled === true) {
      await createScheduleIfNotExists(
        WorkflowKeys.EmailDigest,
        String(payload.user_id),
      );
    }
  }

  // Remove specific email schedules
  if (payload.recap_email_enabled === false) {
    await deleteScheduleIfExists(
      WorkflowKeys.EmailRecap,
      String(payload.user_id),
    );
  }

  if (payload.digest_email_enabled === false) {
    await deleteScheduleIfExists(
      WorkflowKeys.EmailDigest,
      String(payload.user_id),
    );
  }
}

export const processSubscriptionPreferencesUpdated: EventHandler<
  'SubscriptionPreferencesUpdated',
  typeof output
> = async ({ payload }) => {
  const provider = notificationsProvider();
  const subPreferences = await models.SubscriptionPreference.findOne({
    where: {
      user_id: payload.user_id,
    },
  });

  if (!subPreferences) {
    throw new Error('Failed to find user subscription preferences');
  }

  if (config.NOTIFICATIONS.SEND_EMAILS || config.NODE_ENV === 'test') {
    await handleEmailPreferenceUpdates(payload, subPreferences);
  }

  if (config.PUSH_NOTIFICATIONS.FLAG_KNOCK_PUSH_NOTIFICATIONS_ENABLED) {
    const userProperties: { [key: string]: boolean } = {};
    const keys = [
      'mobile_push_notifications_enabled',
      'mobile_push_discussion_activity_enabled',
      'mobile_push_admin_alerts_enabled',
    ];
    keys.forEach((key) => {
      if (key in payload) {
        userProperties[key] = payload[key];
      }
    });

    if (Object.keys(userProperties).length) {
      await provider.identifyUser({
        user_id: String(payload.user_id),
        user_properties: userProperties,
      });
    }
  }

  return true;
};
