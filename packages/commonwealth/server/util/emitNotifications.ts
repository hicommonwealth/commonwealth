/* eslint-disable max-len */
import { logger, stats } from '@hicommonwealth/core';
import { type DB, type NotificationInstance } from '@hicommonwealth/model';
import {
  IChainEventNotificationData,
  IForumNotificationData,
  NotificationCategories,
  NotificationDataAndCategory,
} from '@hicommonwealth/shared';
import Sequelize, { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { mapNotificationsDataToSubscriptions } from './subscriptionMapping';
import { dispatchWebhooks } from './webhooks/dispatchWebhook';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const { Op } = Sequelize;

export default async function emitNotifications(
  models: DB,
  notification_data_and_category: NotificationDataAndCategory,
  excludeAddresses?: string[],
  includeAddresses?: string[],
): Promise<NotificationInstance> {
  const notification_data = notification_data_and_category.data;
  const category_id = notification_data_and_category.categoryId;
  // get subscribers to send notifications to
  stats().increment('cw.notifications.created', {
    category_id,
    chain:
      (notification_data as any).chain || (notification_data as any).chain_id,
  });

  const uniqueOptions = mapNotificationsDataToSubscriptions(
    notification_data_and_category,
  );
  const findOptions: any = {
    [Op.and]: [{ category_id }, { ...uniqueOptions }, { is_active: true }],
  };

  // typeguard function to differentiate between chain event notifications as needed
  let chainEvent: IChainEventNotificationData;
  const isChainEventData = category_id === NotificationCategories.ChainEvent;

  if (isChainEventData) {
    chainEvent = <IChainEventNotificationData>notification_data;
  }

  // retrieve distinct user ids given a set of addresses
  const fetchUsersFromAddresses = async (
    addresses: string[],
  ): Promise<number[]> => {
    // fetch user ids from address models
    const addressModels = await models.Address.findAll({
      where: {
        address: {
          [Op.in]: addresses,
        },
      },
    });
    if (addressModels && addressModels.length > 0) {
      const userIds = addressModels.map((a) => a.user_id);

      // remove duplicates and null user_ids
      const userIdsDedup = userIds.filter(
        (a, b) => userIds.indexOf(a) === b && a !== null,
      );
      // @ts-expect-error StrictNullChecks
      return userIdsDedup;
    } else {
      return [];
    }
  };

  // currently excludes override includes, but we may want to provide the option for both
  if (excludeAddresses && excludeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(excludeAddresses);
    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.notIn]: ids } });
    }
  } else if (includeAddresses && includeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(includeAddresses);
    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.in]: ids } });
    }
  }

  // get all relevant subscriptions
  const subscriptions = await models.Subscription.findAll({
    where: findOptions,
    include: models.User,
  });

  // get notification if it already exists
  let notification: NotificationInstance;
  // @ts-expect-error StrictNullChecks
  if (isChainEventData && chainEvent.id) {
    // @ts-expect-error StrictNullChecks
    notification = await models.Notification.findOne({
      where: {
        // @ts-expect-error StrictNullChecks
        chain_event_id: chainEvent.id,
      },
    });
  } else {
    // @ts-expect-error StrictNullChecks
    notification = await models.Notification.findOne({
      where: {
        notification_data: JSON.stringify(notification_data),
      },
    });
  }

  // if the notification does not yet exist create it here
  if (!notification) {
    if (isChainEventData) {
      // @ts-expect-error StrictNullChecks
      notification = await models.Notification.create({
        // @ts-expect-error StrictNullChecks
        notification_data: JSON.stringify(chainEvent),
        // @ts-expect-error StrictNullChecks
        chain_event_id: chainEvent.id,
        category_id: 'chain-event',
        // @ts-expect-error StrictNullChecks
        community_id: chainEvent.community_id,
      });
    } else {
      // @ts-expect-error StrictNullChecks
      notification = await models.Notification.create({
        notification_data: JSON.stringify(notification_data),
        category_id,
        community_id: (<IForumNotificationData>notification_data).community_id,
        thread_id:
          Number((<IForumNotificationData>notification_data).thread_id) ||
          undefined,
      });
    }
  }

  let query = `INSERT INTO "NotificationsRead" (notification_id, subscription_id, is_read, user_id) VALUES `;
  const replacements = [];
  for (const subscription of subscriptions) {
    if (subscription.subscriber_id) {
      stats().increment('cw.notifications.emitted', {
        category_id,
        chain:
          (notification_data as any).chain ||
          (notification_data as any).chain_id,
        subscriber: `${subscription.subscriber_id}`,
      });
      query += `(?, ?, ?, ?), `;
      replacements.push(
        // @ts-expect-error StrictNullChecks
        notification.id,
        subscription.id,
        false,
        subscription.subscriber_id,
      );
    } else {
      // TODO: rollbar reported issue originates from here
      log.info(
        `Subscription: ${JSON.stringify(
          subscription.toJSON(),
        )}\nNotification_data: ${JSON.stringify(notification_data)}`,
      );
    }
  }
  if (replacements.length > 0) {
    query = query.slice(0, -2) + ';';
    await models.sequelize.query(query, {
      replacements,
      type: QueryTypes.INSERT,
    });
  }

  if (config.SEND_WEBHOOKS_EMAILS) {
    // webhooks
    try {
      await dispatchWebhooks(notification_data_and_category);
    } catch (e) {
      log.error('Failed to dispatch webhooks', e);
    }
  }

  return notification;
}
