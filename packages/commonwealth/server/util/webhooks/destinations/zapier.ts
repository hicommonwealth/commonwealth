import { NotificationCategories } from 'common-common/src/types';
import { ChainEventWebhookData, ForumWebhookData } from '../types';
import request from 'superagent';

type ZapierWebhookMessage = {
  event: NotificationCategories;
  author: {
    name: string;
    url: string;
    icon_url: string;
  };
  title: string;
  url: string;
  context: string;
};

function formatZapierMessage(
  category: NotificationCategories,
  data: ForumWebhookData
): ZapierWebhookMessage {
  return {
    event: category,
    author: {
      name: data.profileName,
      url: data.profileUrl,
      icon_url: data.profileAvatarUrl,
    },
    title: data.titlePrefix + data.objectTitle,
    url: data.objectUrl,
    context: data.objectSummary,
  };
}

export function sendZapierWebhook(
  webhookUrl: string,
  category: NotificationCategories,
  data: ForumWebhookData | ChainEventWebhookData
) {
  if (category === NotificationCategories.ChainEvent) {
    return Promise.reject(
      new Error('Chain event webhooks not supported for Zapier')
    );
  }

  const message = formatZapierMessage(category, data as ForumWebhookData);
  return request.post(webhookUrl).send(message);
}
