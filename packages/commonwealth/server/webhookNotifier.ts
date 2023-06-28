import type { CWEvent } from 'chain-events/src/interfaces';
import { Label as ChainEventLabel } from 'chain-events/src/util';

import { NotificationCategories } from 'common-common/src/types';
import { capitalize } from 'lodash';
import { Op } from 'sequelize';
import request from 'superagent';
import { renderQuillDeltaToText, smartTrim, validURL } from '../shared/utils';
import {
  DEFAULT_COMMONWEALTH_LOGO,
  SERVER_URL,
  SLACK_FEEDBACK_WEBHOOK,
} from './config';

export interface WebhookContent {
  notificationCategory: string;
  chain?: string;
  body?: string;
  community?: string;
  author_chain?: string;
  title?: string;
  bodyUrl?: string;
  url?: string;
  user?: any;
  chainEvent?: any;
}

const REGEX_IMAGE =
  /\b(https?:\/\/\S*?\.(?:png|jpe?g|gif)(?:\?(?:(?:(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)|(?:[\w_-]+)))?)\b/;
const REGEX_EMOJI =
  /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;

const getFilteredContent = (content, address) => {
  if (content.chainEvent && content.chainEventType) {
    // construct compatible CW event from DB by inserting network from type
    const evt = {
      blockNumber: content.chainEvent.block_number,
      data: content.chainEvent.event_data,
      network: content.chainEventType.event_network,
    } as CWEvent;

    const event = ChainEventLabel(content.chainEventType.chain, evt);
    const title = `${capitalize(content.chainEventType.chain)}`;
    const chainEventLink = `${SERVER_URL}/${content.chainEventType.chain}`;
    const fulltext =
      `${event.heading} on ${capitalize(
        content.chainEventType?.chain
      )} at block` + ` ${content.chainEvent?.block_number} \n${event.label}`;
    return { title, fulltext, chainEventLink };
  } else {
    const community = `${content.chain || content.community}`;
    const actor = `${address?.Profile?.profile_name || content.user}`;
    const action =
      content.notificationCategory === NotificationCategories.NewComment
        ? 'commented on'
        : content.notificationCategory === NotificationCategories.NewMention
        ? 'mentioned you in the thread'
        : content.notificationCategory ===
          NotificationCategories.NewCollaboration
        ? 'invited you to collaborate on'
        : content.notificationCategory === NotificationCategories.NewThread
        ? 'created a new thread'
        : '';

    // Titles may be URI-encoded, or not (e.g. some imports)
    let actedOn;
    try {
      actedOn = decodeURIComponent(content.title);
    } catch (err) {
      actedOn = content.title;
    }

    const actedOnLink = content.url;

    const notificationTitlePrefix =
      content.notificationCategory === NotificationCategories.NewComment
        ? 'Comment on: '
        : content.notificationCategory === NotificationCategories.NewThread
        ? 'New thread: '
        : content.notificationCategory === NotificationCategories.NewReaction
        ? 'Reaction on: '
        : 'Activity on: ';

    const bodytext = decodeURIComponent(content.body);

    const notificationPreviewImageUrl = (() => {
      // retrieves array of matching `bodytext` against REGEX_IMAGE
      const matches = bodytext.match(REGEX_IMAGE);
      // in case, it doesn't contain any images
      if (!matches) return null;
      // return the first image urleh
      return matches[0];
    })();

    const notificationExcerpt = (() => {
      try {
        // parse and use quill document
        const doc = JSON.parse(bodytext);
        if (!doc.ops) throw new Error();
        const text = renderQuillDeltaToText(doc);
        return smartTrim(text);
      } catch (err) {
        // use markdown document directly
        return smartTrim(bodytext);
      }
    })();

    return {
      community,
      actor,
      action,
      actedOn,
      actedOnLink,
      notificationTitlePrefix,
      notificationExcerpt,
      notificationPreviewImageUrl,
    };
  }
};

const send = async (models, content: WebhookContent) => {
  let address;
  try {
    address = await models.Address.findOne({
      where: {
        address: content.user,
        chain: content.author_chain,
      },
      include: [models.Profile],
    });
  } catch (err) {
    // pass nothing if no matching address is found
  }

  // if a community is passed with the content, we know that it is from a community
  const chainOrCommObj = content.chain ? { chain_id: content.chain } : null;
  const notificationCategory = content.chainEvent
    ? content.chainEvent.chain_event_type_id
    : content.notificationCategory;
  // grab all webhooks for specific community
  const chainOrCommWebhooks = await models.Webhook.findAll({
    where: {
      ...chainOrCommObj,
      categories: {
        [Op.contains]: [notificationCategory],
      },
    },
  });
  const chainOrCommwebhookUrls = [];
  chainOrCommWebhooks.forEach((wh) => {
    if (validURL(wh.url)) {
      chainOrCommwebhookUrls.push(wh.url);
    }
  });

  const {
    actor,
    actedOn,
    actedOnLink,
    notificationTitlePrefix,
    notificationExcerpt,
    notificationPreviewImageUrl, // forum events
    title,
    chainEventLink,
    fulltext, // chain events
  } = getFilteredContent(content, address);
  const isChainEvent = !!chainEventLink;

  let actorAvatarUrl = null;
  const actorAccountLink = address
    ? `${SERVER_URL}/profile/id/${address?.Profile?.id}`
    : null;

  if (address?.Profile) {
    actorAvatarUrl = address?.Profile?.avatar_url;
  }

  let previewImageUrl = null; // image url of webhook preview
  let previewAltText = null; // Alt text of preview image

  // First case
  if (!isChainEvent) {
    // if event (thread or comment), need to show embedded image as preview
    if (notificationPreviewImageUrl) {
      previewImageUrl = notificationPreviewImageUrl;
      previewAltText = 'Embedded';
    }
  }

  // Second case
  if (!previewImageUrl) {
    if (content.chain) {
      // if the chain has a logo, show it as preview image
      const chain = await models.Chain.findOne({
        where: { id: content.chain },
      });
      if (chain) {
        if (chain.icon_url) {
          previewImageUrl = chain.icon_url.match(`^(http|https)://`)
            ? chain.icon_url
            : `https://commonwealth.im${chain.icon_url}`;
        }
        // can't handle the prefix of `previeImageUrl` with SERVER_URL
        // because social platforms can't access to localhost:8080.
        previewAltText = chain.name;
      }
    }
  }

  // Third case
  if (!previewImageUrl) {
    // if no embedded image url or the chain/community doesn't have a logo,
    // show the Commonwealth logo as the preview image
    previewImageUrl = previewImageUrl || DEFAULT_COMMONWEALTH_LOGO;
    previewAltText = previewAltText || 'Commonwealth';
  }

  await Promise.all(
    chainOrCommwebhookUrls
      .filter((url) => !!url)
      .map(async (url) => {
        let webhookData;
        if (url.indexOf('slack.com') !== -1) {
          // slack webhook format (stringified JSON)
          webhookData = JSON.stringify({
            blocks: [
              {
                type: 'context',
                elements: actorAvatarUrl?.length
                  ? [
                      {
                        type: 'image',
                        image_url: actorAvatarUrl,
                        alt_text: 'Actor:',
                      },
                      {
                        type: 'mrkdwn',
                        text: `<${actorAccountLink}|${actor}>`,
                      },
                    ]
                  : [
                      {
                        type: 'plain_text',
                        text: actor,
                      },
                    ],
              },
              {
                type: 'section',
                text: isChainEvent
                  ? {
                      type: 'mrkdwn',
                      text:
                        (process.env.NODE_ENV !== 'production'
                          ? '[dev] '
                          : '') + fulltext,
                    }
                  : {
                      type: 'mrkdwn',
                      text: `*${
                        process.env.NODE_ENV !== 'production' ? '[dev] ' : ''
                      }${notificationTitlePrefix}* <${actedOnLink}|${actedOn}> \n> ${notificationExcerpt
                        .split('\n')
                        .join('\n> ')}`,
                    },
                accessory: {
                  type: 'image',
                  image_url: previewImageUrl,
                  alt_text: previewAltText,
                },
              },
            ],
          });
        } else if (url.indexOf('discord.com') !== -1) {
          // discord webhook format (raw json, for application/json)
          webhookData = isChainEvent
            ? {
                username: 'Commonwealth',
                avatar_url: DEFAULT_COMMONWEALTH_LOGO,
                embeds: [
                  {
                    author: {
                      name: 'New chain event',
                      url: chainEventLink,
                      icon_url: previewImageUrl,
                    },
                    title,
                    url: chainEventLink,
                    description: fulltext,
                    color: 15258703,
                    thumbnail: {
                      url: previewImageUrl,
                    },
                  },
                ],
              }
            : {
                username: 'Commonwealth',
                avatar_url: DEFAULT_COMMONWEALTH_LOGO,
                embeds: [
                  {
                    author: {
                      name: actor,
                      url: actorAccountLink,
                      icon_url: actorAvatarUrl,
                    },
                    title: notificationTitlePrefix + actedOn,
                    url: actedOnLink,
                    // discord webhook description doesn't accept emoji
                    description: notificationExcerpt.replace(REGEX_EMOJI, ''),
                    color: 15258703,
                    thumbnail: {
                      url: previewImageUrl,
                    },
                  },
                ],
              };
        } else if (url.indexOf('matrix') !== -1) {
          // TODO: matrix format and URL pattern matcher unimplemented
          // return {
          //   'text': `${getFiltered(content, address).join('\n')}`,
          //   'format': 'plain',
          //   'displayName': 'Commonwealth',
          //   'avatarUrl': 'http://commonwealthLogoGoesHere'
          // };
        } else if (
          url.indexOf('telegram') !== -1 &&
          process.env.TELEGRAM_BOT_TOKEN
        ) {
          let getChatUsername = url.split('/@');
          getChatUsername = `@${getChatUsername[1]}`;

          const getUpdatesUrl = `https://api.telegram.org/${process.env.TELEGRAM_BOT_TOKEN}`;
          url = `${getUpdatesUrl}/sendMessage`;

          webhookData = isChainEvent
            ? {
                chat_id: getChatUsername,
                text: `<a href="${chainEventLink}"><b>${title}</b></a>\n\n${fulltext}`,
                parse_mode: 'HTML',
                reply_markup: {
                  resize_keyboard: true,
                  inline_keyboard: [
                    [
                      {
                        text: 'Read more on commonwealth',
                        url: chainEventLink,
                      },
                    ],
                  ],
                },
              }
            : {
                chat_id: getChatUsername,
                text: `<b>Author:</b> <a href="${actorAccountLink}">${actor}</a>\n<a href="${actedOnLink}"><b>${
                  notificationTitlePrefix + actedOn
                }</b></a> \r\n\n${notificationExcerpt.replace(
                  REGEX_EMOJI,
                  ''
                )}`,
                parse_mode: 'HTML',
                reply_markup: {
                  resize_keyboard: true,
                  inline_keyboard: [
                    [{ text: 'Read more on commonwealth', url: actedOnLink }],
                  ],
                },
              };
        } else if (url.indexOf('zapier') !== -1 && !isChainEvent) {
          webhookData = JSON.stringify({
            event: notificationCategory,
            author: {
              name: actor,
              url: actorAccountLink,
              icon_url: actorAvatarUrl,
            },
            title: notificationTitlePrefix + actedOn,
            url: actedOnLink,
            content: notificationExcerpt,
          });
        } else {
          // TODO: other formats unimplemented
        }

        if (!webhookData) {
          console.error('webhook not supported');
          return;
        }
        try {
          if (
            process.env.NODE_ENV === 'production' ||
            (SLACK_FEEDBACK_WEBHOOK && url === SLACK_FEEDBACK_WEBHOOK)
          ) {
            await request.post(url).send(webhookData);
          } else {
            console.log('Suppressed webhook notification to', url);
          }
        } catch (err) {
          console.error(err);
        }
      })
  );
};

export default send;
