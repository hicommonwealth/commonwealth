import request from 'superagent';
import { NotificationCategories } from '../shared/types';
import { Op } from 'sequelize';
import e from 'express';
import { capitalize } from 'lodash';

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
    "text": `\`\`\`${getFilteredContent(content, address).join('\n')}\`\`\``,
    "format": "plain",
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

const discordFormat = (content, address?) => {
  return {
    'content': `${getFilteredContent(content, address).join('\n')}`,
  }
}

const getFilteredContent = (content, address) => {
  return [
    address ? `Name: ${address.name}` : null,
    content.user ? `Address: ${content.user}` : null,
    (!content.community && content.chain) ? `Chain: ${content.chain}` : null,
    content.community ? `Community: ${content.community}` : null,
    content.notificationCategory ? `Type: ${content.notificationCategory}` : null,
    content.chainEventType ? `${capitalize(content.chainEventType.event_name)} event on ${capitalize(content.chainEventType.chain)}` : null,
    content.title ? `Title: ${decodeURIComponent(content.title)}` : null,
    content.bodyUrl ? `External Link: ${content.bodyUrl}` : null,
    content.url ? `Link: ${content.url}` : null,
  ].filter((elt) => !!elt);
};

const send = async (models, content: WebhookContent) => {
  console.log('webhook content', content);
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
  console.log('chainOrCommObj', chainOrCommObj);
  const notificationCategory = (content.chainEvent) ? content.chainEvent.chain_event_type_id : content.notificationCategory;
  console.log('notificationCategory', notificationCategory);
  // grab all webhooks for specific community
  const chainOrCommWebhooks = await models.Webhook.findAll({
    where: {
      ...chainOrCommObj,
      categories: {
        [Op.contains]: [notificationCategory],
      },
    },
  });
  console.log('all webhooks', chainOrCommWebhooks);
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
      console.log(url);
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
