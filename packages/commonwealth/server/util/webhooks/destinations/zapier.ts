/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotificationCategories } from '@hicommonwealth/core';
import request from 'superagent';
import { ChainEventWebhookData, ForumWebhookData } from '../types';

type ZapierWebhookMessage = {
  event: NotificationCategories;
  previewImageUrl: string;
  previewImageAltText: string;
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
  data: ForumWebhookData,
): ZapierWebhookMessage {
  return {
    event: category,
    previewImageUrl: data.previewImageUrl,
    previewImageAltText: data.previewImageAltText,
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

export async function sendZapierWebhook(
  webhookUrl: string,
  category: NotificationCategories,
  data: ForumWebhookData | ChainEventWebhookData,
) {
  if (category === NotificationCategories.ChainEvent) {
    throw new Error('Chain event webhooks not supported for Zapier');
  }

  const message = formatZapierMessage(category, data as ForumWebhookData);
  return request.post(webhookUrl).send(message);
}
