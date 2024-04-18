import { NotificationCategories } from '@hicommonwealth/shared';
import request from 'superagent';
import { SERVER_URL, TELEGRAM_BOT_TOKEN } from '../../../config';
import {
  ChainEventWebhookData,
  ForumWebhookData,
  WebhookDataByCategory,
} from '../types';
import { REGEX_EMOJI } from '../util';

type TelegramWebhookMessage = {
  chat_id: string;
  text: string;
  parse_mode: 'HTML';
  reply_markup: {
    resize_keyboard: true;
    inline_keyboard: [
      [
        {
          text: 'Read more on Commonwealth';
          url: string;
        },
      ],
    ];
  };
};

/**
 * Documentation for Telegram message formatting: https://core.telegram.org/bots/api#sendmessage
 */
function formatTelegramMessage<C extends NotificationCategories>(
  category: C,
  data: WebhookDataByCategory<C>,
  channelId: string,
): TelegramWebhookMessage {
  let text: string;
  let chatUrl: string;
  if (category === NotificationCategories.ChainEvent) {
    const { url, title, description } = data as ChainEventWebhookData;
    text = `<a href="${url}"><b>${title}</b></a>\n\n${description}`;
    chatUrl = url;
  } else {
    const typedData = data as ForumWebhookData;
    text =
      `<b>Author: </b>` +
      `<a href="${typedData.profileUrl}">${typedData.profileName}</a>\n` +
      `<a href="${typedData.objectUrl}">` +
      `<b>${typedData.titlePrefix + typedData.objectTitle}</b>` +
      `</a>\r\n\n` +
      `${typedData.objectSummary.replace(REGEX_EMOJI, '')}`;
    chatUrl = typedData.objectUrl;
  }

  return {
    chat_id: channelId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      resize_keyboard: true,
      inline_keyboard: [
        [
          {
            text: 'Read more on Commonwealth',
            url: chatUrl,
          },
        ],
      ],
    },
  } as any;
}

/**
 * Note that webhookUrl is a Telegram API url containing a channel id and not an actual bot url.
 */
export async function sendTelegramWebhook(
  // TODO: Telegram urls are currently useless since we just parse them to get the channel id
  //  telegram webhooks should not have urls but channel ids instead
  webhookUrl: string,
  category: NotificationCategories,
  data: ForumWebhookData | ChainEventWebhookData,
) {
  // telegram API does not allow localhost urls in messages so replace them with Commonwealth url
  if (SERVER_URL.includes('localhost')) {
    for (const key of [
      'previewImageUrl',
      'profileUrl',
      'profileAvatarUrl',
      'objectUrl',
      'url',
    ]) {
      if (data[key]) {
        data[key] = data[key].replace(
          'http://localhost:8080',
          'https://commonwealth.im',
        );
      }
    }
  }

  const [, channelId] = webhookUrl.split('/@');
  if (!channelId) {
    throw new Error('Invalid Telegram webhook URL');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const message = formatTelegramMessage(category, data, channelId);
  return request.post(url).send(message);
}
