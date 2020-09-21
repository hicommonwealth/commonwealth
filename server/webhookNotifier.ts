import request from 'superagent';
import { NotificationCategories } from '../shared/types';
import { Op } from 'sequelize';
import e from 'express';
import { capitalize } from 'lodash';
import { SERVER_URL } from './config';
import { SubstrateEvents } from '@commonwealth/chain-events';

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

// do not send webhook notifications for noisy reaction types
// const SUPPRESSED_NOTIFICATION_TYPES = [NotificationCategories.NewReaction];

const validURL = (str) => {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
};

const slackFormat = (content, address) => {
  return JSON.stringify({
    "type": 'section',
    // "text": `\`\`\`${getFilteredContent(content, address).join('\n')}\`\`\``,
    // "format": "plain",
    "text": `${getFilteredContentMarkdown(content, address).join('\n')}`,
    "format": "mrkdwn",
  });
};

const matrixFormat = (content, address) => {
  return {
    "text": `${getFilteredContent(content, address).join('\n')}`,
    "format": 'plain',
    "displayName": "Commonwealth Webhook",
    "avatarUrl": "http://commonwealthLogoGoesHere" // TODO
  };
}

const telegramFormat = (content, address) => {
  return {
  }
}

const discordFormat = (content, address?) => {
  let event;
  let titleLabel;
  if (content.chainEvent && content.chainEventType) event = SubstrateEvents.Label(content.chainEvent.block_number, content.chainEventType.chain, content.chainEvent.event_data);
  if (!event) {
    switch (content.notificationCategory) {
      case (NotificationCategories.NewComment): 
        titleLabel = 'New comment on ';
        break;
      case (NotificationCategories.NewThread):
        titleLabel = 'New thread: ';
        break;
      case (NotificationCategories.NewReaction):
        titleLabel = 'New reaction on ';
        break;
      default:
        titleLabel = '';
    }
  }
  return (content.notificationCategory !== 'chain-event') ? { // Forum Event Discord JSON
    'username': 'Commonwealth',
    'avatar_url': 'https://commonwealth.im/static/img/logo.png',
    // 'content': ``,
    "embeds": [
      {
        "author": {
          "name": `${address ? address.name : content.user}`,
          "url": `${content.url}`,
          "icon_url": "https://commonwealth.im/static/img/logo.png"
        },
        "title": `${titleLabel}${decodeURIComponent(content.title)}`,
        "url": `${content.url}`,
        "description": `${content.body}`,
        "color": 15258703,
        // "fields": [
        //   {
        //     "name": "Text",
        //     "value": "More text",
        //     "inline": true
        //   },
        // ],
        "footer": {
          "text": "–Commonwealth Labs :dove:",
          "icon_url": "https://commonwealth.im/static/img/logo.png"
        }
      }
    ]
  } : { // Chain Event Discord JSON
    'username': 'Commonwealth',
    'avatar_url': 'https://commonwealth.im/static/img/logo.png',
    "embeds": [
      {
        // "author": {
        //   "name": `Chain Event`,
        //   "url": `${content.url}`,
        //   "icon_url": "https://commonwealth.im/static/img/logo.png"
        // },
        "title": `${capitalize(content.chainEventType.chain)}`,
        "url": `${SERVER_URL}/${content.chainEventType.chain}`,
        "color": 15258703,
        "description": `${event.heading} on ${capitalize(content.chainEventType.chain)} \nBlock ${content.chainEvent.block_number} \n${event.label}`,
        "footer": {
          "text": "–Commonwealth Labs :dove:",
          "icon_url": "https://commonwealth.im/static/img/logo.png"
        }
      }
    ]
  };
}

const getFilteredContentMarkdown = (content, address) => {
  let event;
  if (content.chainEvent && content.chainEventType) event = SubstrateEvents.Label(content.chainEvent.block_number, content.chainEventType.chain, content.chainEvent.event_data);
  return [
    address ? `*Name:* ${address.name}` : null,
    content.user ? `*Address:* _${content.user}_` : null,
    (!content.community && content.chain) ? `*Chain:* ${content.chain}` : null,
    content.community ? `*Community:* ${content.community}` : null,
    content.notificationCategory ? `*Type:* ${content.notificationCategory}` : null,
    content.chainEventType ? `*${capitalize(content.chainEventType.event_name)}* event on _${capitalize(content.chainEventType.chain)}_` : null,
    content.chainEvent && content.chainEventType ? `${event.heading} on ${capitalize(content.chainEventType.chain)} \nBlock ${content.chainEvent.block_number} \n${event.label}` : null,
    content.title ? `*Title:* ${decodeURIComponent(content.title)}` : null,
    content.bodyUrl ? `*External Link:* ${content.bodyUrl}` : null,
    content.url ? `*Link:* ${content.url}` : null,
  ].filter((elt) => !!elt);
};

const getFilteredContent = (content, address) => {
  let event;
  if (content.chainEvent && content.chainEventType) event = SubstrateEvents.Label(content.chainEvent.block_number, content.chainEventType.chain, content.chainEvent.event_data);
  return [
    address ? `Name: ${address.name}` : null,
    content.user ? `Address: ${content.user}` : null,
    (!content.community && content.chain) ? `Chain: ${content.chain}` : null,
    content.community ? `Community: ${content.community}` : null,
    content.notificationCategory ? `Type: ${content.notificationCategory}` : null,
    content.chainEventType ? `${capitalize(content.chainEventType.event_name)} event on ${capitalize(content.chainEventType.chain)}` : null,
    content.chainEvent && content.chainEventType ? `${event.heading} on ${capitalize(content.chainEventType.chain)} \nBlock ${content.chainEvent.block_number} \n${event.label}` : null,
    content.title ? `Title: ${decodeURIComponent(content.title)}` : null,
    content.bodyUrl ? `External Link: ${content.bodyUrl}` : null,
    content.url ? `Link: ${content.url}` : null,
  ].filter((elt) => !!elt);
};

const send = async (models, content: WebhookContent) => {
  let address;
  try {
    address = await models.Address.findOne({ where: { address: content.user, chain: content.author_chain } });
  } catch (e) {
    // pass nothing if no matching address is found
  }

  // if a community is passed with the content, we know that it is from an offchain community
  const chainOrCommObj = (content.community) ? { offchain_community_id: content.community }
    : (content.chain) ? { chain_id: content.chain }
    : null;
  const notificationCategory = (content.chainEvent) ? content.chainEvent.chain_event_type_id : content.notificationCategory;
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
      // format data for sending
      const data = (url.indexOf('slack') !== -1) ? slackFormat(content, address)
        : (url.indexOf('discord') !== -1) ? discordFormat(content, address)
          : null;
      if (!data) { console.error('webhook not supported'); return; };

      try {
        return await request.post(url).send(data);
      } catch (e) {
        console.error(e)
        return;
      }
    }));


};

export default send;
