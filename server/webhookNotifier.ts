import request from 'superagent';
import { Op } from 'sequelize';
import { capitalize } from 'lodash';
import { SubstrateEvents } from '@commonwealth/chain-events';

import { NotificationCategories } from '../shared/types';
import { smartTrim, validURL, renderQuillDeltaToText } from '../shared/utils';
import { getForumNotificationCopy } from '../shared/notificationFormatter';
import { SERVER_URL, SLACK_FEEDBACK_WEBHOOK } from './config';

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
        : (content.notificationCategory === NotificationCategories.NewThread) ? 'created a new thread'
          : '');
    const actedOn = decodeURIComponent(content.title);
    const actedOnLink = content.url;

    const notificationTitlePrefix = content.notificationCategory === NotificationCategories.NewComment
      ? 'Comment on: '
      : content.notificationCategory === NotificationCategories.NewThread ? 'New thread: '
        : content.notificationCategory === NotificationCategories.NewReaction ? 'Reaction on: '
          : 'Activity on: ';
    const notificationExcerpt = (() => {
      let bodytext = decodeURIComponent(content.body);
      try {
        // parse and use quill document
        const doc = JSON.parse(bodytext);
        const text = renderQuillDeltaToText(doc);
        return smartTrim(text);
      } catch (err) {
        // use markdown document directly
        return smartTrim(bodytext);
      }
    })();

    return { community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt };
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
  await Promise.all(chainOrCommwebhookUrls
    .filter((url) => !!url)
    .map(async (url) => {
      const {
        community, actor, action, actedOn, actedOnLink, notificationTitlePrefix, notificationExcerpt, // forum events
        title, chainEventLink, fulltext // chain events
      } = getFilteredContent(content, address);
      const isChainEvent = !!chainEventLink;

      let webhookData;
      if (url.indexOf('slack') !== -1) {
        // slack webhook format (stringified JSON)
        webhookData = JSON.stringify(isChainEvent ? {
          type: 'section',
          text: fulltext,
          format: 'mrkdwn',
        } : {
          type: 'section',
          text: `${notificationTitlePrefix}<${actedOnLink}|${actedOn}>`
            + `\n> ${notificationExcerpt.split('\n').join('\n> ')}`,
          format: 'mrkdwn',
        });
      } else if (url.indexOf('discord') !== -1) {
        // discord webhook format (raw json, for application/json)
        webhookData = isChainEvent ? {
          username: 'Commonwealth',
          avatar_url: 'https://commonwealth.im/static/img/logo.png',
          embeds: [{
            author: {
              name: 'New chain event',
              url: chainEventLink,
              icon_url: 'https://commonwealth.im/static/img/logo.png'
            },
            title,
            url: chainEventLink,
            description: fulltext,
            color: 15258703,
          }]
        } : {
          username: 'Commonwealth',
          avatar_url: 'https://commonwealth.im/static/img/logo.png',
          embeds: [{
            author: {
              name: actor,
              url: actedOnLink,
              icon_url: 'https://commonwealth.im/static/img/logo.png'
            },
            title: notificationTitlePrefix + actedOn,
            url: actedOnLink,
            description: notificationExcerpt,
            color: 15258703,
          }]
        };
      } else if (url.indexOf('matrix') !== -1) {
        // TODO: matrix format and URL pattern matcher unimplemented
        // return {
        //   'text': `${getFiltered(content, address).join('\n')}`,
        //   'format': 'plain',
        //   'displayName': 'Commonwealth',
        //   'avatarUrl': 'http://commonwealthLogoGoesHere'
        // };
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
          console.log(webhookData);
        }
      } catch (err) {
        console.error(err);
      }
    }));
};

export default send;
