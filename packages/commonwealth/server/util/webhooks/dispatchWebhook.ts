import {
  NotificationCategories,
  NotificationDataAndCategory,
  logger,
  stats,
} from '@hicommonwealth/core';
import {
  CommunityInstance,
  WebhookInstance,
  models,
} from '@hicommonwealth/model';
import { rollbar } from '../rollbar';
import { sendDiscordWebhook } from './destinations/discord';
import { sendSlackWebhook } from './destinations/slack';
import { sendTelegramWebhook } from './destinations/telegram';
import { sendZapierWebhook } from './destinations/zapier';
import { getWebhookData } from './getWebhookData';
import { WebhookDestinations } from './types';
import { fetchWebhooks, getWebhookDestination } from './util';

const log = logger().getLogger(__filename);

// TODO: @Timothee disable/deprecate a webhook ulr if it fails too many times (remove dead urls)
export async function dispatchWebhooks(
  notification: NotificationDataAndCategory,
  webhooks?: WebhookInstance[],
) {
  if (
    notification.categoryId === NotificationCategories.SnapshotProposal ||
    notification.categoryId === NotificationCategories.ThreadEdit ||
    notification.categoryId === NotificationCategories.CommentEdit
  ) {
    log.warn(
      `Webhooks not supported for ${notification.categoryId} notifications`,
    );
    return;
  }

  if (!webhooks) {
    webhooks = await fetchWebhooks(notification);
  }

  let communityId: string;
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    communityId = notification.data.chain;
  } else {
    communityId = notification.data.chain_id;
  }

  const community: CommunityInstance | undefined =
    await models.Community.findOne({
      where: {
        id: communityId,
      },
    });

  const webhookData = Object.freeze(
    await getWebhookData(notification, community),
  );

  const webhookPromises = [];
  for (const webhook of webhooks) {
    switch (getWebhookDestination(webhook.url)) {
      case WebhookDestinations.Discord:
        webhookPromises.push(
          sendDiscordWebhook(
            webhook.url,
            notification.categoryId,
            {
              ...webhookData,
            },
            community,
          ),
        );
        break;
      case WebhookDestinations.Slack:
        webhookPromises.push(
          sendSlackWebhook(webhook.url, notification.categoryId, {
            ...webhookData,
          }),
        );
        break;
      case WebhookDestinations.Telegram:
        webhookPromises.push(
          sendTelegramWebhook(webhook.url, notification.categoryId, {
            ...webhookData,
          }),
        );
        break;
      case WebhookDestinations.Zapier:
        webhookPromises.push(
          sendZapierWebhook(webhook.url, notification.categoryId, {
            ...webhookData,
          }),
        );
        break;
      default:
        log.warn(`Unknown webhook destination: ${webhook.url}`);
    }
  }

  const results = await Promise.allSettled(webhookPromises);
  for (const result of results) {
    if (result.status === 'rejected') {
      stats().increment('webhook.error');
      let error;
      if (result.reason instanceof Error) {
        error = result.reason;
      } else if (result.reason?.response?.error) {
        error = result.reason.response.error;
      }

      // TODO: Issue #5230
      log.error(`Error sending webhook: ${result.reason}`, error);
      // log.error(`Error sending webhook: ${result.reason}`, error);
      rollbar.error(`Error sending webhook: ${result.reason}`, error);
    } else {
      stats().increment('webhook.success');
    }
  }
}
