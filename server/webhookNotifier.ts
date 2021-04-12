import request from 'superagent';
import { Op } from 'sequelize';
import { capitalize } from 'lodash';
import { SubstrateEvents } from '@commonwealth/chain-events';

import { NotificationCategories } from '../shared/types';
import { smartTrim, validURL, renderQuillDeltaToText } from '../shared/utils';
import { getForumNotificationCopy } from '../shared/notificationFormatter';
import { SERVER_URL, SLACK_FEEDBACK_WEBHOOK, DEFAULT_COMMONWEALTH_LOGO } from './config';

export interface WebhookContent {
  notificationCategory: string;
  chain?: string;
  community?: string;
  author_chain?: string;
  title: string;
  bodyUrl?: string;
  url?: string;
  user: any;
  chainEvent?: any;
}

const REGEX_IMAGE = /\b(https?:\/\/\S*?\.(?:png|jpe?g|gif)(?:\?(?:(?:(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)|(?:[\w_-]+)))?)\b/;
const REGEX_EMOJI = /([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g;

const getFilteredContent = (content, address) => {
  let event;
  if (content.chainEvent && content.chainEventType) {
    event = SubstrateEvents.Label(
      content.chainEvent.block_number,
      content.chainEventType.chain,
      content.chainEvent.event_data
    );
    const title = `${capitalize(content.chainEventType.chain)}`;
    const chainEventLink = `${SERVER_URL}/${content.chainEventType.chain}`;
    const fulltext = `${event.heading} on ${capitalize(content.chainEventType?.chain)} at block`
      + ` ${content.chainEvent?.block_number} \n${event.label}`;
    return { title, fulltext, chainEventLink };
  } else {
    const community = `${content.chain || content.community}`;
    const actor = `${address?.name || content.user}`;
    const action = ((content.notificationCategory === NotificationCategories.NewComment) ? 'commented on'
      : (content.notificationCategory === NotificationCategories.NewMention) ? 'mentioned you in the thread'
        : (content.notificationCategory === NotificationCategories.NewCollaboration) ? 'invited you to collaborate on'
          : (content.notificationCategory === NotificationCategories.NewThread) ? 'created a new thread'
            : '');
    const actedOn = decodeURIComponent(content.title);
    const actedOnLink = content.url;

    const notificationTitlePrefix = content.notificationCategory === NotificationCategories.NewComment
      ? 'Comment on: '
      : content.notificationCategory === NotificationCategories.NewThread ? 'New thread: '
        : content.notificationCategory === NotificationCategories.NewReaction ? 'Reaction on: '
          : 'Activity on: ';

    // url decoded
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

    return { community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt, notificationPreviewImageUrl };
  }
};

const send = async (models, content: WebhookContent) => {
  let address;
  try {
    address = await models.Address.findOne({ where: { address: content.user, chain: content.author_chain } });
  } catch (err) {
    // pass nothing if no matching address is found
  }

  // if a community is passed with the content, we know that it is from an offchain community
  const chainOrCommObj = (content.community) ? { offchain_community_id: content.community }
    : (content.chain) ? { chain_id: content.chain }
      : null;
  const notificationCategory = (content.chainEvent)
    ? content.chainEvent.chain_event_type_id : content.notificationCategory;
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
    // We currently only support slack webhooks
    if (validURL(wh.url)) {
      chainOrCommwebhookUrls.push(wh.url);
    }
  });

  const {
    community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt, notificationPreviewImageUrl, // forum events
    title, chainEventLink, fulltext // chain events
  } = getFilteredContent(content, address);
  const isChainEvent = !!chainEventLink;

  let actorAvatarUrl = null;
  const actorAccountLink = address ? `${SERVER_URL}/${address.chain}/account/${address.address}` : null;

  if (address?.id) {
    const actorProfile = await models.OffchainProfile.findOne({ where: { address_id: address.id } });
    if (actorProfile?.data) {
      actorAvatarUrl = JSON.parse(actorProfile.data).avatarUrl;
    }
  }

  let previewImageUrl = null; // image url of webhook preview
  let previewAltText = null; // Alt text of preview image

  // First case
  if (!isChainEvent) {
    // if offchain event (thread or comment), need to show embedded image as preview
    if (notificationPreviewImageUrl) {
      previewImageUrl = notificationPreviewImageUrl;
      previewAltText = 'Embedded';
    }
  }

  // Second case
  if (!previewImageUrl) {
    if (content.chain) {
      // if the chain has a logo, show it as preview image
      const chain = await models.Chain.findOne({ where: { id: content.chain } });
      if (chain) {
        previewImageUrl = `https://commonwealth.im${chain.icon_url}`;
        // can't handle the prefix of `previeImageUrl` with SERVER_URL
        // because social platforms can't access to localhost:8080.
        previewAltText = chain.name;
      }
    } else if (content.community) {
      // if the community has a logo, show it as preview image
      const offchainCommunity = await models.OffchainCommunity.findOne({ where: { id: content.community, privacyEnabled: false } });
      if (offchainCommunity) {
        previewImageUrl = `https://commonwealth.im${offchainCommunity.iconUrl}`;
        previewAltText = offchainCommunity.name;
      }
    }
  }

  // Third case
  if (!previewImageUrl) {
    // if no embedded image url or the chain/community doesn't have a logo, show the Commonwealth logo as the preview image
    previewImageUrl = previewImageUrl || DEFAULT_COMMONWEALTH_LOGO;
    previewAltText = previewAltText || 'CommonWealth';
  }

  await Promise.all(chainOrCommwebhookUrls
    .filter((url) => !!url)
    .map(async (url) => {
      let webhookData;
      if (url.indexOf('slack.com') !== -1) {
        // slack webhook format (stringified JSON)
        webhookData = JSON.stringify({
          blocks: [
            {
              type: 'context',
              elements: actorAvatarUrl?.length ? [
                {
                  type: 'image',
                  image_url: actorAvatarUrl,
                  alt_text: 'Actor:'
                },
                {
                  type: 'mrkdwn',
                  text: `<${actorAccountLink}|${actor}>`,
                }
              ] : [
                {
                  type: 'plain_text',
                  text: actor,
                }
              ]
            },
            {
              type: 'section',
              text: isChainEvent ? {
                type: 'mrkdwn',
                text: (process.env.NODE_ENV !== 'production' ? '[dev] ' : '') + fulltext
              } : {
                type: 'mrkdwn',
                text: `*${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''}${notificationTitlePrefix}* <${actedOnLink}|${actedOn}> \n> ${notificationExcerpt.split('\n').join('\n> ')}`
              },
              accessory: {
                type: 'image',
                image_url: previewImageUrl,
                alt_text: previewAltText
              }
            }
          ],
        });
      } else if (url.indexOf('discord.com') !== -1) {
        // discord webhook format (raw json, for application/json)
        webhookData = isChainEvent ? {
          username: 'Commonwealth',
          avatar_url: DEFAULT_COMMONWEALTH_LOGO,
          embeds: [{
            author: {
              name: 'New chain event',
              url: chainEventLink,
              icon_url: previewImageUrl
            },
            title,
            url: chainEventLink,
            description: fulltext,
            color: 15258703,
            thumbnail: {
              'url': previewImageUrl
            },
          }]
        } : {
          username: 'Commonwealth',
          avatar_url: DEFAULT_COMMONWEALTH_LOGO,
          embeds: [{
            author: {
              name: actor,
              url: actorAccountLink,
              icon_url: actorAvatarUrl
            },
            title: notificationTitlePrefix + actedOn,
            url: actedOnLink,
            description: notificationExcerpt.replace(REGEX_EMOJI, ''), // discord webhook description doesn't accept emoji
            color: 15258703,
            thumbnail: {
              'url': previewImageUrl
            },
          }]
        };
      } else if (url.indexOf('telegram') !== -1) {
        const chatId = -562987835;
        webhookData = {
          chat_id: chatId,
          photo: previewImageUrl,
          caption: `<b>Actor:</b> <a href="${actorAccountLink}">${actor}</a> \r\n <a href="${actedOnLink}"><b>${notificationTitlePrefix + actedOn}</b></a> \r\n${notificationExcerpt.replace(REGEX_EMOJI, '')}`,
          parse_mode: 'HTML',
        };
      } else {
        // TODO: other formats unimplemented
      }

      if (!webhookData) {
        console.error('webhook not supported');
        return;
      }
      try {
        if (process.env.NODE_ENV === 'production' || (SLACK_FEEDBACK_WEBHOOK && url === SLACK_FEEDBACK_WEBHOOK)) {
          await request.post(url).send(webhookData);
        } else {
          console.log('Suppressed webhook notification to', url);
        }
      } catch (err) {
        console.error(err);
      }
    }));
};

export default send;
