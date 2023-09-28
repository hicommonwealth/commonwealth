import { NotificationDataAndCategory } from 'types';
import { sendDiscordWebhook } from './webhookEndpointUtil/discord';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { fetchWebhooks, getWebhookDestination } from './util';
import { getWebhookData } from './getWebhookData';
import { WebhookDestinations } from './types';
import { sendSlackWebhook } from './webhookEndpointUtil/slack';

const log = factory.getLogger(formatFilename(__filename));

export async function dispatchWebhooks(
  notifDataCategory: NotificationDataAndCategory
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

  const webhooks = await fetchWebhooks(notifDataCategory);
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
        break;
      default:
        log.warn(`Unknown webhook destination: ${webhook.url}`);
    }
  }

  return await Promise.allSettled(webhookPromises);
}
