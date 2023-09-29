import { NotificationDataAndCategory } from 'types';
import { sendDiscordWebhook } from './webhookDestinations/discord';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { fetchWebhooks, getWebhookDestination } from './util';
import { getWebhookData } from './getWebhookData';
import { WebhookDestinations } from './types';
import { sendSlackWebhook } from './webhookDestinations/slack';
import { sendTelegramWebhook } from './webhookDestinations/telegram';
import { WebhookInstance } from '../../models/webhook';
import { sendZapierWebhook } from './webhookDestinations/zapier';

const log = factory.getLogger(formatFilename(__filename));

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
          sendDiscordWebhook(
            webhook.url,
            notifDataCategory.categoryId,
            webhookData
          )
        );
        break;
      case WebhookDestinations.Slack:
        webhookPromises.push(
          sendSlackWebhook(
            webhook.url,
            notifDataCategory.categoryId,
            webhookData
          )
        );
        break;
      case WebhookDestinations.Telegram:
        webhookPromises.push(
          sendTelegramWebhook(
            webhook.url,
            notifDataCategory.categoryId,
            webhookData
          )
        );
        break;
      case WebhookDestinations.Zapier:
        webhookPromises.push(
          sendZapierWebhook(
            webhook.url,
            notifDataCategory.categoryId,
            webhookData
          )
        );
      default:
        log.warn(`Unknown webhook destination: ${webhook.url}`);
    }
  }

  const results = await Promise.allSettled(webhookPromises);
  for (const result of results) {
    if (result.status === 'rejected') {
      const res = result.reason.response;
      // console.log(res.error);
      // console.log(result.reason.response);

      console.error(
        `Error sending webhook:\n` +
          `\tStatus: ${res.statusCode}\n` +
          `\tError Message: ${res.error}\n` +
          `\tError Text: ${res.error.text}\n`
      );
    }
  }
}
