import { StatsDController } from 'common-common/src/statsd';
import Sequelize, { QueryTypes } from 'sequelize';
import type { IChainEventNotificationData } from 'types';
import { SERVER_URL } from '../../config';
import type { DB } from '../../models';
import type { NotificationInstance } from '../../models/notification';
import {
  createImmediateNotificationEmailObject,
  sendImmediateNotificationEmail,
} from '../../scripts/emails';
import type { WebhookContent } from '../../webhookNotifier';
import { factory, formatFilename } from 'common-common/src/logging';
import { NotificationCategories } from 'common-common/src/types';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export async function filterAddresses(
  models,
  findOptions: any,
  includedAddresses: string[],
  excludedAddresses: string[]
) {
  const query = `
        SELECT DISTINCT user_id
        FROM "Addresses"
        WHERE address IN (?);
      `;
  // currently excludes override includes, but we may want to provide the option for both
  if (excludedAddresses && excludedAddresses.length > 0) {
    const ids = <number[]>(
      (<unknown>(
        await models.sequelize.query(query, {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: excludedAddresses,
        })
      ))
    );
    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.notIn]: ids } });
    }
  } else if (includedAddresses && includedAddresses.length > 0) {
    const ids = <number[]>(
      (<unknown>(
        await models.sequelize.query(query, {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: includedAddresses,
        })
      ))
    );

    if (ids && ids.length > 0) {
      findOptions[Op.and].push({ subscriber_id: { [Op.in]: ids } });
    }
  }
  return findOptions;
}

export default async function emitChainEventNotification(
  models: DB,
  chain_id: string,
  notification_data: IChainEventNotificationData,
  excludeAddresses?: string[],
  includeAddresses?: string[]
): Promise<NotificationInstance> {
  // get subscribers to send notifications to
  StatsDController.get().increment('cw.notifications.created', {
    category_id: NotificationCategories.ChainEvent,
    object_id: chain_id,
    chain: notification_data.chain,
  });

  let subFindOptions: any = {
    [Op.and]: [
      { category_id: NotificationCategories.ChainEvent },
      { chain_id },
      { object_id: chain_id },
      { is_active: true },
    ],
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

  const [notification, created] = await models.Notification.findOrCreate({
    where: {
      chain_event_id: notification_data.id,
    },
    defaults: {
      notification_data: JSON.stringify(notification_data),
      chain_event_id: notification_data.id,
      category_id: 'chain-event',
      chain_id: notification_data.chain,
      entity_id: notification_data.entity_id,
    },
  });

  let msg;
  try {
    msg = await createImmediateNotificationEmailObject(
      notification_data,
      chain_id,
      models
    );
  } catch (e) {
    console.log('Error generating immediate notification email!');
    console.trace(e);
  }

  // send emails
  for (const subscription of subscriptions) {
    if (msg && subscription?.immediate_email) {
      // TODO: verify this works
      msg.dynamic_template_data.notification.path = `${SERVER_URL}/${notification_data.chain}/notifications?id=${notification.id}`;
      sendImmediateNotificationEmail(subscription.User, msg);
    }
  }

  // TODO: fix chain-event webhooks

  return notification;
}
