import {
  EventHandler,
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { EmailNotificationInterval, events } from '@hicommonwealth/schemas';
import z from 'zod/v4';
import { config } from '../../config';
import { models } from '../../database';
import { SubscriptionPreferenceInstance } from '../../models';
import { mapDateToDaysOfWeek } from './util';

const log = logger(import.meta);

const output = z.boolean();

async function createScheduleIfNotExists(
  workflowKey: WorkflowKeys.EmailRecap | WorkflowKeys.EmailDigest,
  userId: string,
  emailNotificationInterval: z.infer<typeof EmailNotificationInterval>,
): Promise<boolean> {
  const provider = notificationsProvider();

  const existingSchedules = await provider.getSchedules({
    user_id: userId,
    workflow_id: workflowKey,
  });

  if (existingSchedules.length === 0 && emailNotificationInterval !== 'never') {
    await provider.createSchedules({
      user_ids: [userId],
      workflow_id: workflowKey,
      schedule: [
        {
          frequency: emailNotificationInterval,
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
        subscriptionPreferences.User!.emailNotificationInterval || 'never',
      );
    }

    if (payload.digest_email_enabled === true) {
      await createScheduleIfNotExists(
        WorkflowKeys.EmailDigest,
        String(payload.user_id),
        subscriptionPreferences.User!.emailNotificationInterval || 'never',
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
    include: [
      {
        model: models.User,
        required: true,
        attributes: ['id', 'email', 'emailNotificationInterval'],
      },
    ],
  });

  if (!subPreferences) {
    throw new Error('Failed to find user subscription preferences');
  }

  if (config.NOTIFICATIONS.SEND_EMAILS || config.NODE_ENV === 'test') {
    await handleEmailPreferenceUpdates(payload, subPreferences);
  }

  const userProperties: {
    mobile_push_notifications_enabled?: boolean;
    mobile_push_discussion_activity_enabled?: boolean;
    mobile_push_admin_alerts_enabled?: boolean;
  } = {};
  const keys = [
    'mobile_push_notifications_enabled',
    'mobile_push_discussion_activity_enabled',
    'mobile_push_admin_alerts_enabled',
  ] as const;
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

  return true;
};
