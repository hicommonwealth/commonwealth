import { NotificationCategories } from 'common-common/src/types';
import { DEFAULT_COMMONWEALTH_LOGO } from '../../../config';
import request from 'superagent';
import { NotificationDataAndCategory } from 'types';
import { WebhookInstance } from '../../../models/webhook';

export function isDiscordWebhookEndpoint(webhook: WebhookInstance) {
  return webhook.url.includes('discord.com/api/webhooks');
}

export function sendDiscordWebhook(
  webhookUrl: string,
  notifDataCategory: NotificationDataAndCategory,
  actor: string
) {
  if (actor === 'Discord Bot') return;

  if (notifDataCategory.categoryId === NotificationCategories.ChainEvent) {
  } else {
    const data = {
      username: 'Commonwealth',
      avatar_url: DEFAULT_COMMONWEALTH_LOGO,
      embeds: [],
    };
    return request.post(webhookUrl).send(data);
  }
}
