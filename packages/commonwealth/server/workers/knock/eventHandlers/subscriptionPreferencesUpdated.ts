import {
  EventHandler,
  logger,
  notificationsProvider,
  RepeatFrequency,
  WorkflowKeys,
} from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { DaysOfWeek } from '@knocklabs/node';
import z from 'zod';

const log = logger(import.meta);

const output = z.boolean();

function mapDateToDaysOfWeek(
  date: Date,
  // @ts-expect-error StrictNullChecks
): typeof DaysOfWeek[keyof typeof DaysOfWeek] {
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
    case 6:
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

export const processSubscriptionPreferencesUpdated: EventHandler<
  'SubscriptionPreferencesUpdated',
  typeof output
> = async ({ payload }) => {
  const provider = notificationsProvider();

  // remove recap/digest email schedules if emails are completely disabled
  if (payload.email_notifications_enabled === false) {
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
    const deletedSchedules = await provider.deleteSchedules({
      schedule_ids: ids,
    });
    const allDeleted = ids.every((id) => deletedSchedules.has(id));
    if (!allDeleted) {
      throw new Error('Failed to delete schedules');
    }

    return true;
  }

  const subPreferences = await models.SubscriptionPreference.findOne({
    where: {
      user_id: payload.user_id,
    },
  });

  if (subPreferences!.email_notifications_enabled) {
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

  return true;
};
