import { NotificationDataAndCategory } from 'types';
import {
  isDiscordWebhookEndpoint,
  sendDiscordWebhook,
} from './webhookEndpointUtil/discord';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { fetchWebhooks, getWebhookData } from './util';

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
    if (isDiscordWebhookEndpoint(webhook)) {
      webhookPromises.push(
        sendDiscordWebhook(
          webhook.url,
          notifDataCategory.categoryId,
          webhookData
        )
      );
    }
  }

  return await Promise.allSettled(webhookPromises);
}
