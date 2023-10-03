import { NotificationDataAndCategory } from 'types';
import { sendDiscordWebhook } from './destinations/discord';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { fetchWebhooks, getWebhookDestination } from './util';
import { getWebhookData } from './getWebhookData';
import { WebhookDestinations } from './types';
import { sendSlackWebhook } from './destinations/slack';
import { sendTelegramWebhook } from './destinations/telegram';
import { WebhookInstance } from '../../models/webhook';
import { sendZapierWebhook } from './destinations/zapier';
import { rollbar } from '../rollbar';

const log = factory.getLogger(formatFilename(__filename));

// TODO: @Timothee disable/deprecate a webhook ulr if it fails too many times (remove dead urls)
export async function dispatchWebhooks(
  notifDataCategory: NotificationDataAndCategory,
  webhooks?: WebhookInstance[]
) {
  if (
    notifDataCategory.categoryId === NotificationCategories.SnapshotProposal ||
    notifDataCategory.categoryId === NotificationCategories.ThreadEdit ||
    notifDataCategory.categoryId === NotificationCategories.CommentEdit
  ) {
    log.warn(
      `Webhooks not supported for ${notifDataCategory.categoryId} notifications`
    );
    return;
  }

  if (!webhooks) {
    webhooks = await fetchWebhooks(notifDataCategory);
  }
  const webhookData = await getWebhookData(notifDataCategory);

  const webhookPromises = [];
  for (const webhook of webhooks) {
    switch (getWebhookDestination(webhook.url)) {
      case WebhookDestinations.Discord:
        webhookPromises.push(
          sendDiscordWebhook(webhook.url, notifDataCategory.categoryId, {
            ...webhookData,
          })
        );
        break;
      case WebhookDestinations.Slack:
        webhookPromises.push(
          sendSlackWebhook(webhook.url, notifDataCategory.categoryId, {
            ...webhookData,
          })
        );
        break;
      case WebhookDestinations.Telegram:
        webhookPromises.push(
          sendTelegramWebhook(webhook.url, notifDataCategory.categoryId, {
            ...webhookData,
          })
        );
        break;
      case WebhookDestinations.Zapier:
        webhookPromises.push(
          sendZapierWebhook(webhook.url, notifDataCategory.categoryId, {
            ...webhookData,
          })
        );
        break;
      default:
        log.warn(`Unknown webhook destination: ${webhook.url}`);
    }
  }

  const results = await Promise.allSettled(webhookPromises);
  for (const result of results) {
    if (result.status === 'rejected') {
      let error;
      if (result.reason instanceof Error) {
        error = result.reason;
      } else if (result.reason?.response?.error) {
        error = result.reason.response.error;
      }

      log.error(`Error sending webhook: ${result.reason}`, error);
      rollbar.error(`Error sending webhook: ${result.reason}`, error);
    }
  }
}
