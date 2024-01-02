import { NotificationCategories } from '@hicommonwealth/core';
import request from 'superagent';
import {
  ChainEventWebhookData,
  ForumWebhookData,
  WebhookDataByCategory,
} from '../types';

type ContextElements =
  | [
      {
        type: 'mrkdwn';
        text: string;
      },
    ]
  | [
      {
        type: 'mrkdwn';
        text: string;
      },
      {
        type: 'image';
        image_url: string;
        alt_text: 'Actor:';
      },
    ]
  | [
      {
        type: 'plain_text';
        text: string;
      },
    ];

type SlackWebhookMessage = {
  blocks: [
    {
      type: 'context';
      elements: ContextElements;
    },
    {
      type: 'section';
      text: {
        type: 'mrkdwn';
        text: string;
      };
      accessory: {
        type: 'image';
        image_url: string;
        alt_text: string;
      };
    },
  ];
};

function formatSlackMessage<C extends NotificationCategories>(
  category: C,
  data: WebhookDataByCategory<C>,
): SlackWebhookMessage {
  let textPrefix = '';
  if (process.env.NODE_ENV !== 'production') {
    textPrefix = '[dev] ';
  }

  let sectionText: string;
  let contextElements: ContextElements;
  if (category === NotificationCategories.ChainEvent) {
    const typedData = data as ChainEventWebhookData;
    sectionText =
      `*${textPrefix}* ` +
      `<${typedData.url}|${typedData.title}> ` +
      `\n> ${typedData.description.split('\n').join('\n> ')}`;
    contextElements = [
      {
        type: 'plain_text',
        text: 'New chain event',
      },
    ];
  } else {
    const typedData = data as ForumWebhookData;
    sectionText =
      // bolded title prefix
      `*${textPrefix}${typedData.titlePrefix}* ` +
      // object title with hyperlink
      `<${typedData.objectUrl}|${typedData.objectTitle}> ` +
      // object summary indented in blockquote
      `\n> ${typedData.objectSummary.split('\n').join('\n> ')}`;
    if (typedData.profileName && typedData.profileAvatarUrl) {
      contextElements = [
        {
          type: 'mrkdwn',
          text: `<${typedData.profileUrl}|${typedData.profileName}>`,
        },
        {
          type: 'image',
          image_url: typedData.profileAvatarUrl,
          alt_text: 'Actor:',
        },
      ];
    } else if (typedData.profileName && !typedData.profileAvatarUrl) {
      contextElements = [
        {
          type: 'mrkdwn',
          text: `<${typedData.profileUrl}|${typedData.profileName}>`,
        },
      ];
    } else {
      contextElements = [
        {
          type: 'plain_text',
          text: 'New forum activity',
        },
      ];
    }
  }

  return {
    blocks: [
      {
        type: 'context',
        elements: contextElements,
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: sectionText,
        },
        accessory: {
          type: 'image',
          image_url: data.previewImageUrl,
          alt_text: data.previewImageAltText,
        },
      },
    ],
  };
}

export async function sendSlackWebhook(
  webhookUrl: string,
  category: NotificationCategories,
  data: ForumWebhookData | ChainEventWebhookData,
) {
  const slackMessage = formatSlackMessage(category, data);
  return request.post(webhookUrl).send(slackMessage);
}
