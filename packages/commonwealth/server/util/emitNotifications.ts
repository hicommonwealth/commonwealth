import { StatsDController } from 'common-common/src/statsd';
import { ChainBase, ChainType } from 'common-common/src/types';
import Sequelize, { QueryTypes } from 'sequelize';
import type {
  IChainEventNotificationData,
  ICommunityNotificationData,
  IPostNotificationData,
  SnapshotEventType,
  SnapshotNotification,
} from '../../shared/types';
import { SERVER_URL } from '../config';
import type { DB } from '../models';
import type { NotificationInstance } from '../models/notification';
import {
  createImmediateNotificationEmailObject,
  sendImmediateNotificationEmail,
} from '../scripts/emails';
import type { WebhookContent } from '../webhookNotifier';
import send from '../webhookNotifier';
import { factory, formatFilename } from 'common-common/src/logging';
import { SupportedNetwork } from 'chain-events/src';

const log = factory.getLogger(formatFilename(__filename));

const { Op } = Sequelize;

export type NotificationDataTypes =
  | IPostNotificationData
  | ICommunityNotificationData
  | IChainEventNotificationData
  | (SnapshotNotification & { eventType: SnapshotEventType });


function incrementStatsDController(notification_data, category_id, object_id) {
  StatsDController.get().increment('cw.notifications.created', {
    category_id,
    object_id,
    chain: (notification_data as any).chain || (notification_data as any).chain_id,
  });
}


function checkIsChainEventData(notification_data) {
  return !!(
    typeof (<any>notification_data).id === 'number' &&
    typeof (<any>notification_data).block_number === 'number' &&
    (<any>notification_data).event_data &&
    Object.values(SupportedNetwork).includes(
      (<any>notification_data).network
    ) &&
    (<any>notification_data).chain &&
    typeof (<any>notification_data).chain === 'string' &&
    typeof (<any>notification_data).entity_id === 'number'
  );
}

// retrieve distinct user ids given a set of addresses
const fetchUsersFromAddresses = async ( models,
    addresses: string[]
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

      // remove duplicates
      const userIdsDedup = userIds.filter((a, b) => userIds.indexOf(a) === b);
      return userIdsDedup;
    } else {
      return [];
    }
  };


async function createNotification(models, isChainEventData, chainEvent, category_id, notification_data) {
  // get notification if it already exists
  let notification: NotificationInstance;
  notification = await models.Notification.findOne(
    isChainEventData
      ? {
          where: {
            chain_event_id: chainEvent.id,
          },
        }
      : {
          where: {
            notification_data: JSON.stringify(notification_data),
          },
        }
  );

  // if the notification does not yet exist create it here
  if (!notification) {
    if (isChainEventData) {
      notification = await models.Notification.create({
        notification_data: JSON.stringify(chainEvent),
        chain_event_id: chainEvent.id,
        category_id: 'chain-event',
        chain_id: chainEvent.chain,
        entity_id: chainEvent.entity_id,
      });
    } else {
      notification = await models.Notification.create({
        notification_data: JSON.stringify(notification_data),
        category_id,
        chain_id:
          (<IPostNotificationData>notification_data).chain_id ||
          (<ICommunityNotificationData>notification_data).chain,
        thread_id:
          Number((<IPostNotificationData>notification_data).thread_id) ||
          undefined,
      });
    }
  }

  return notification
}

async function sendEmails(models, subIds, isChainEventData, chainEvent, category_id, notification_data, notification) {
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
    log.warn('Error generating immediate notification email!');
    log.warn(e);
  }

  const subscriptions = await models.Subscription.findAll({
    where: { id: { [Op.in]: subIds } },
    include: models.User,
  });

  // send emails
  for (const subscription of subscriptions) {
    if (msg && isChainEventData && chainEvent.chain) {
      msg.dynamic_template_data.notification.path = `${SERVER_URL}/${chainEvent.chain}/notifications?id=${notification.id}`;
    }
    if (msg && subscription?.immediate_email && subscription?.User) {
      // kick off async call and immediately return
      sendImmediateNotificationEmail(subscription.User, msg);
    }
  }
}

async function sendToWebhooks(models, webhook_data, category_id) {
  const erc20Tokens = (
    await models.Chain.findAll({
      where: {
        base: ChainBase.Ethereum,
        type: ChainType.Token,
      },
    })
  ).map((o) => o.id);

  // send data to relevant webhooks
  if (
    webhook_data &&
    // TODO: this OR clause seems redundant?
    (webhook_data.chainEventType?.chain ||
      !erc20Tokens.includes(webhook_data.chainEventType?.chain))
  ) {
    await send(models, {
      notificationCategory: category_id,
      ...(webhook_data as Required<WebhookContent>),
    });
  }
}

async function runNotificationReadTransaction(models, rawQuery) {
  let rowsAdded
  try {
    await models.sequelize.transaction(async (transaction) => {
      rowsAdded = await models.sequelize.query(
        rawQuery,
        { raw: true, transaction, type: QueryTypes.SELECT }
      );
    })
    return rowsAdded
  } catch(err) {
    log.warn('Error generating notification read')
    log.warn(err)
    return []
  }
}

async function createNotificationPerUser(models, notification, category_id, object_id, excludeAddresses, includeAddresses) {

  let address_include_exclude = '';
  if (excludeAddresses && excludeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(models, excludeAddresses);
    address_include_exclude = `and "Subscription"."subscriber_id" NOT IN (${ids.join(',')})`
  } else if (includeAddresses && includeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(models, includeAddresses);
    if (ids && ids.length > 0) {
      address_include_exclude = `and "Subscription"."subscriber_id" NOT IN (${ids.join(',')})`
    }
  }

  const rawQuery = `
  BEGIN;

  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

  CREATE TEMP TABLE "TempNotificationRead" AS 
  SELECT ${notification.id} as notification_id, "Subscription"."id" as subscription_id, false as is_read, "Subscription"."subscriber_id" as user_id, 
  COALESCE(nrm.max_id, 0) + 1 as id
  FROM "Subscriptions" AS "Subscription"
  LEFT JOIN "NotificationsReadMax" nrm on nrm.user_id = "Subscription"."subscriber_id"
  WHERE (
          "Subscription"."category_id" = '${category_id}'
          AND "Subscription"."object_id" = '${object_id}'
          AND "Subscription"."is_active" = true
          ${address_include_exclude}
  );

  INSERT INTO "NotificationsRead"(notification_id, subscription_id, is_read, user_id, id)
  SELECT notification_id, subscription_id, is_read, user_id, id
  FROM "TempNotificationRead";

  UPDATE "NotificationsReadMax" 
  SET max_id = tr.id
  FROM "TempNotificationRead" tr 
  where tr.user_id="NotificationsReadMax".user_id;
  
  SELECT * FROM "TempNotificationRead";
  COMMIT;
  `

  const rows = await runNotificationReadTransaction(models, rawQuery)
  return rows
}


export default async function emitNotifications(
  models: DB,
  category_id: string,
  object_id: string,
  notification_data: NotificationDataTypes,
  webhook_data?: Partial<WebhookContent>,
  excludeAddresses?: string[],
  includeAddresses?: string[]
): Promise<NotificationInstance> {

  // send notification created event to datadog
  incrementStatsDController(notification_data, category_id, object_id)

  // typeguard function to differentiate between chain event notifications as needed
  let chainEvent: IChainEventNotificationData;
  const isChainEventData = checkIsChainEventData(notification_data)
  if (isChainEventData) {
    chainEvent = <IChainEventNotificationData>notification_data;
  }
  const notification = await createNotification(models, isChainEventData, chainEvent, category_id, notification_data)
  const rowsAdded = await createNotificationPerUser(models, notification, category_id, object_id, excludeAddresses, includeAddresses)
  const subscriptions = rowsAdded.map(r=>r.subscription_id)
  Promise.all([sendEmails(models, subscriptions, isChainEventData, chainEvent, category_id, notification_data, notification),
  sendToWebhooks(models, webhook_data, category_id)])
  return notification;
}
