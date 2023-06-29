import { StatsDController } from 'common-common/src/statsd';
import Sequelize from 'sequelize';
import type {
  ICommunityNotificationData,
  IPostNotificationData,
  SnapshotEventType,
  SnapshotNotification,
} from 'types';
import type { DB } from '../../models';
import type { NotificationInstance } from '../../models/notification';
import {
  createImmediateNotificationEmailObject,
  sendImmediateNotificationEmail,
} from '../../scripts/emails';
import type { WebhookContent } from '../../webhookNotifier';
import send from '../../webhookNotifier';
import {
  NotificationCategory,
  NotificationCategories,
} from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { filterAddresses } from './util';
import { SubscriptionAttributes } from '../../models/subscription';
import Notification_category from '../../models/notification_category';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export type NotificationDataTypes =
  | IPostNotificationData
  | ICommunityNotificationData
  | (SnapshotNotification & { eventType: SnapshotEventType });

/**
 * This function translates a notification category into the set of data points required to uniquely identify a
 * subscription.
 */
export function getUniqueSubscriptionData(
  category: NotificationCategory,
  notification_data: any
) {
  const chain_id =
    (notification_data as any).chain || (notification_data as any).chain_id;

  if (category === NotificationCategories.NewThread) {
    if (!chain_id) {
      log.error(
        `Attempting to reference a ${category} subscription without a chain_id`
      );
      return;
    }
    return { chain_id };
  } else if (
    category === NotificationCategories.NewMention ||
    category === NotificationCategories.NewCollaboration
  ) {
    // if (!notification_data.)
  } else if (
    category === NotificationCategories.NewReaction ||
    category === NotificationCategories.NewComment
  ) {
  } else if (category === NotificationCategories.SnapshotProposal) {
  } else {
    log.trace(
      `The ${category} notifications category does not support subscriptions`
    );
    return;
  }
}

export default async function emitNotifications(
  models: DB,
  category_id: string,
  notification_data: NotificationDataTypes,
  webhook_data?: Partial<WebhookContent>,
  excludeAddresses?: string[],
  includeAddresses?: string[]
): Promise<NotificationInstance> {
  const chain_id =
    (notification_data as any).chain || (notification_data as any).chain_id;
  // get subscribers to send notifications to
  StatsDController.get().increment('cw.notifications.created', {
    category_id,
    chain: chain_id,
  });

  const uniqueData = getUniqueSubscriptionData(category_id, notification_data);
  if (!uniqueData) {
    log.error(
      `Cannot create a notification for ${category_id} since subscriptions cannot be fetched.`
    );
  }

  let subFindOptions: { [Op.and]: any[] } = {
    [Op.and]: [{ category_id }, uniqueData, { is_active: true }],
  };
  subFindOptions = await filterAddresses(
    models,
    subFindOptions,
    includeAddresses,
    excludeAddresses
  );
  const subscriptions = await models.Subscription.findAll({
    where: subFindOptions,
    include: [
      {
        model: models.User,
        required: true,
      },
    ],
  });

  // get notification if it already exists
  const [notification, created] = await models.Notification.findOrCreate({
    where: {
      notification_data: JSON.stringify(notification_data),
    },
    defaults: {
      notification_data: JSON.stringify(notification_data),
      category_id,
      chain_id,
      thread_id:
        Number((<IPostNotificationData>notification_data).thread_id) ||
        undefined,
    },
  });

  let msg;
  try {
    if (category_id !== 'snapshot-proposal') {
      msg = await createImmediateNotificationEmailObject(
        notification_data,
        category_id,
        models
      );
    }
  } catch (e) {
    console.log('Error generating immediate notification email!');
    console.trace(e);
  }

  // send emails
  if (msg) {
    for (const subscription of subscriptions) {
      if (subscription?.immediate_email) {
        sendImmediateNotificationEmail(subscription.User, msg);
      }
    }
  }

  // send data to relevant webhooks
  if (webhook_data) {
    await send(models, {
      notificationCategory: category_id,
      ...(webhook_data as Required<WebhookContent>),
    });
  }

  return notification;
}
