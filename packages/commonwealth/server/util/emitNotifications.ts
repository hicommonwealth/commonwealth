import { makeTimeObject, diffMilliseconds } from 'common-common/src/logTime';
import { promiseAllSettled } from 'common-common/src/promiseUtils';
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

export const metricIds = {
  eventCreatedCount: 'cw.notifications.created',
  eventLatencyMs: 'cw.notifications.latency_ms',
  eventEmittedCount: 'cw.notifications.emitted',
  eventEmittedLatencyMs: 'cw.notifications.emitted.latency_ms',
  eventEmailCount: 'cw.notifications.email',
  eventEmailSuccessCount: 'cw.notifications.email.success',
  eventEmailErrorCount: 'cw.notifications.email.error',
  eventEmailLatencyMs: 'cw.notifications.email.latency_ms',
  eventWebhookLatencyMs: 'cw.notifications.webhook.latency_ms',
  eventErrorCount: 'cw.notifications.error',
};

function incrementStatsDController(metric_id, tags, value = 1) {
  StatsDController.get().increment(metric_id, value, tags);
}

function histogramStatsDController(metric_id, tags, start) {
  StatsDController.get().histogram(metric_id, diffMilliseconds(start), tags);
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
const fetchUsersFromAddresses = async (
  models,
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

async function createNotification(
  models,
  isChainEventData,
  chainEvent,
  category_id,
  notification_data
) {
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

  return notification;
}

async function sendEmails(
  models,
  subIds,
  isChainEventData,
  chainEvent,
  category_id,
  notification_data,
  notification,
  tags,
  order
) {
  const logEmailTime = makeTimeObject(
    log,
    metricIds.eventEmailLatencyMs,
    tags,
    order
  );
  let msg;
  try {
    try {
      if (category_id !== 'snapshot-proposal') {
        msg = await createImmediateNotificationEmailObject(
          notification_data,
          category_id,
          models
        );
      }
    } catch (e) {
      log.warn(
        `Error generating immediate notification email: ${JSON.stringify(
          tags,
          order
        )}`
      );
      log.warn(e);
      logEmailTime.error();
    }

    if (!msg) return;

    const subscriptions = await models.Subscription.findAll({
      where: { id: { [Op.in]: subIds } },
      include: models.User,
    });

    // send emails
    const emailPromises = [];
    for (const subscription of subscriptions) {
      if (msg && isChainEventData && chainEvent.chain) {
        msg.dynamic_template_data.notification.path = `${SERVER_URL}/${chainEvent.chain}/notifications?id=${notification.id}`;
      }
      if (msg && subscription?.immediate_email && subscription?.User) {
        // kick off async call and immediately return
        emailPromises.push(
          sendImmediateNotificationEmail(subscription.User, msg)
        );
      }
    }

    const result = await promiseAllSettled(emailPromises);
    if (result) {
      incrementStatsDController(
        metricIds.eventEmailSuccessCount,
        tags,
        result.successCount
      );
      incrementStatsDController(
        metricIds.eventEmailErrorCount,
        tags,
        result.errorCount
      );
    }

    incrementStatsDController(
      metricIds.eventEmailCount,
      tags,
      emailPromises.length
    );
    histogramStatsDController(
      metricIds.eventEmailLatencyMs,
      tags,
      logEmailTime.start
    );
    logEmailTime.end();
  } catch (err) {
    log.warn(`Error sending emails: ${JSON.stringify(tags, order)}`);
    logEmailTime.error();
  }
}

async function sendToWebhooks(models, webhook_data, category_id, tags, order) {
  const logWebhooktime = makeTimeObject(
    log,
    metricIds.eventWebhookLatencyMs,
    tags,
    order
  );
  try {
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
    histogramStatsDController(
      metricIds.eventWebhookLatencyMs,
      tags,
      logWebhooktime.start
    );
    logWebhooktime.end();
  } catch (err) {
    log.warn(`webhook error: ${JSON.stringify(tags, order)}`);
    logWebhooktime.error();
  }
}

async function createNotificationPerUser(
  models,
  notification,
  category_id,
  object_id,
  excludeAddresses,
  includeAddresses
) {
  let address_include_exclude = '';
  if (excludeAddresses && excludeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(models, excludeAddresses);
    address_include_exclude = `and "Subscription"."subscriber_id" NOT IN (${ids.join(
      ','
    )})`;
  } else if (includeAddresses && includeAddresses.length > 0) {
    const ids = await fetchUsersFromAddresses(models, includeAddresses);
    if (ids && ids.length > 0) {
      address_include_exclude = `and "Subscription"."subscriber_id" IN (${ids.join(
        ','
      )})`;
    }
  }

  let rowsAdded;
  try {
    await models.sequelize.transaction(async (transaction) => {
      // obtain advisory lock - to serialize access to Users max_notif_offset
      await models.sequelize.query('SELECT pg_advisory_xact_lock(111)', {
        transaction,
      });

      // DROP TABLE  "TempNotificationRead" clear if exists
      await models.sequelize.query(
        'DROP TABLE IF EXISTS "TempNotificationRead"',
        {
          transaction,
        }
      );

      // read user subscriptions to generate one row per user for new notification
      await models.sequelize.query(
        `
          CREATE TEMP TABLE "TempNotificationRead" AS 
          WITH tempRead AS (
            SELECT ${notification.id} as notification_id, "Subscription"."id" as subscription_id,
            false as is_read, "Subscription"."subscriber_id" as user_id, 
            COALESCE(nrm.max_notif_offset, 0) + 1 as new_offset,
            dense_rank() over (Partition by subscriber_id ORDER BY "Subscription"."id" DESC) as rk
            FROM "Subscriptions" AS "Subscription"
            LEFT JOIN "Users" nrm on nrm.id = "Subscription"."subscriber_id"
            WHERE (
                    "Subscription"."category_id" = '${category_id}'
                    AND "Subscription"."object_id" = '${object_id}'
                    AND "Subscription"."is_active" = true
                    ${address_include_exclude}
          ))
          SELECT DISTINCT notification_id, subscription_id, is_read, user_id, new_offset
          FROM tempRead
          WHERE rk = 1
        `,
        { transaction }
      );

      // Insert into NotificationsRead - generate new notifications per user
      await models.sequelize.query(
        `
        INSERT INTO "NotificationsRead"(notification_id, subscription_id, is_read, user_id, id)
        SELECT notification_id, subscription_id, is_read, user_id, new_offset
        FROM "TempNotificationRead"
        `,
        { transaction }
      );

      // update max in users
      await models.sequelize.query(
        `
        UPDATE "Users" 
        SET max_notif_offset = tr.new_offset
        FROM "TempNotificationRead" tr 
        where tr.user_id="Users".id
        `,
        { transaction }
      );

      // return new Notifications added to be used for sending emails, webhook notifications etc
      rowsAdded = await models.sequelize.query(
        `
        SELECT notification_id, subscription_id, is_read, user_id, new_offset as id
        FROM "TempNotificationRead"
        `,
        {
          raw: true,
          transaction,
          type: QueryTypes.SELECT,
        }
      );

      // DROP TABLE  "TempNotificationRead" clear if exists while exiting
      await models.sequelize.query(
        'DROP TABLE IF EXISTS "TempNotificationRead"',
        {
          transaction,
        }
      );
    });

    return rowsAdded;
  } catch (err) {
    log.error('Error generating notification read');
    log.error(JSON.stringify(err));
    return [];
  }
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
  const chain =
    (notification_data as any).chain || (notification_data as any).chain_id;
  const tags = { chain, category_id, object_id };
  const order = ['category_id', 'chain', 'object_id'];
  const processEventTime = makeTimeObject(
    log,
    metricIds.eventLatencyMs,
    tags,
    order
  );

  try {
    // send notification created event to datadog
    // typeguard function to differentiate between chain event notifications as needed
    let chainEvent: IChainEventNotificationData;
    const isChainEventData = checkIsChainEventData(notification_data);
    if (isChainEventData) {
      chainEvent = <IChainEventNotificationData>notification_data;
    }

    const notification = await createNotification(
      models,
      isChainEventData,
      chainEvent,
      category_id,
      notification_data
    );
    incrementStatsDController(metricIds.eventCreatedCount, tags);

    const generateNotificationsTime = makeTimeObject(
      log,
      metricIds.eventEmittedLatencyMs,
      tags,
      order
    );
    const rowsAdded = await createNotificationPerUser(
      models,
      notification,
      category_id,
      object_id,
      excludeAddresses,
      includeAddresses
    );
    histogramStatsDController(
      metricIds.eventEmittedLatencyMs,
      tags,
      generateNotificationsTime.start
    );
    incrementStatsDController(
      metricIds.eventEmittedCount,
      tags,
      rowsAdded.length
    );
    generateNotificationsTime.end();

    const subscriptions = rowsAdded.map((r) => r.subscription_id);
    promiseAllSettled([
      sendEmails(
        models,
        subscriptions,
        isChainEventData,
        chainEvent,
        category_id,
        notification_data,
        notification,
        tags,
        order
      ),
      sendToWebhooks(models, webhook_data, category_id, tags, order),
    ]);
    processEventTime.end();
    histogramStatsDController(
      metricIds.eventLatencyMs,
      tags,
      processEventTime.start
    );
    return notification;
  } catch (err) {
    log.error(err);
    incrementStatsDController(metricIds.eventErrorCount, tags);
    processEventTime.error();
  }
}
