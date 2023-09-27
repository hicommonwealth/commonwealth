import { NotificationCategories } from 'common-common/src/types';
import { DEFAULT_COMMONWEALTH_LOGO } from '../../../config';
import request from 'superagent';
import { WebhookInstance } from '../../../models/webhook';
import {
  ChainEventWebhookData,
  ForumWebhookData,
  WebhookDataByCategory,
} from '../types';
import { REGEX_EMOJI } from '../util';

type DiscordWebhookMessage = {
  username: string;
  avatar_url: string;
  embeds: [
    {
      author: {
        name: string;
        url: string;
        icon_url: string;
      };
      title: string;
      url: string;
      description: string;
      color: number;
      thumbnail: {
        url: string;
      };
    }
  ];
};

function formatDiscordMessage<C extends NotificationCategories>(
  category: C,
  data: WebhookDataByCategory<C>
): DiscordWebhookMessage {
  if (category === NotificationCategories.ChainEvent) {
    const typedData = data as ChainEventWebhookData;
    return {
      username: 'Commonwealth',
      avatar_url: DEFAULT_COMMONWEALTH_LOGO,
      embeds: [
        {
          author: {
            name: 'New chain event',
            url: typedData.url,
            icon_url: typedData.previewImageUrl,
          },
          title: typedData.title,
          url: typedData.url,
          description: typedData.description,
          color: 15258703,
          thumbnail: {
            url: typedData.previewImageUrl,
          },
        },
      ],
    };
  } else {
    const typedData = data as ForumWebhookData;
    return {
      username: 'Commonwealth',
      avatar_url: DEFAULT_COMMONWEALTH_LOGO,
      embeds: [
        {
          author: {
            name: typedData.profileName,
            url: typedData.profileUrl,
            icon_url: typedData.profileAvatarUrl,
          },
          title: typedData.title,
          url: typedData.objectUrl,
          description: typedData.objectSummary.replace(REGEX_EMOJI, ''),
          color: 15258703,
          thumbnail: {
            url: typedData.previewImageUrl,
          },
        },
      ],
    };
  }
}

export function sendDiscordWebhook(
  webhookUrl: string,
  category: NotificationCategories,
  data: ForumWebhookData | ChainEventWebhookData
) {
  if ('profileName' in data && data.profileName === 'Discord Bot') return;

  const discordMessage = formatDiscordMessage(category, data);

  return request.post(webhookUrl).send(discordMessage);
}

export function isDiscordWebhookEndpoint(webhook: WebhookInstance) {
  return webhook.url.includes('discord.com/api/webhooks');
}
