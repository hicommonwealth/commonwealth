import request from 'superagent';
import { NotificationCategories } from '../shared/types';
import { Op } from 'sequelize';

export interface WebhookContent {
  notificationCategory: string;
  chain?: string;
  community?: string;
  title: string;
  bodyUrl?: string;
  url?: string;
  user: any;
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

const getFilteredContent = (content, address) => {
  return [
    address ? `Name: ${address.name}` : null,
    content.user ? `Address: ${content.user}` : null,
    (!content.community && content.chain) ? `Chain: ${content.chain}` : null,
    content.community ? `Community: ${content.community}` : null,
    content.notificationCategory ? `Type: ${content.notificationCategory}` : null,
    content.title ? `Title: ${decodeURIComponent(content.title)}` : null,
    content.bodyUrl ? `External Link: ${content.bodyUrl}` : null,
    content.url ? `Link: ${content.url}` : null,
  ].filter((elt) => !!elt);
};

const send = async (models, content: WebhookContent) => {
  // if (SUPPRESSED_NOTIFICATION_TYPES.indexOf(content.notificationCategory) !== -1) return;
  console.log('webhook content', content);
  let address;
  try {
    address = await models.Address.findOne({ where: { address: content.user, chain: content.chain } });
  } catch (e) {
    // pass nothing if no matching address is found
  }

  // create data for sending
  const data = JSON.stringify({
    text: `\`\`\`${getFilteredContent(content, address).join('\n')}\`\`\``
  });
  // if a community is passed with the content, we know that it is from an offchain community
  const chainOrCommObj = (content.community)
    ? { offchain_community_id: content.community }
    : { chain_id: content.chain };
  // grab all webhooks for specific community
  const chainOrCommWebhooks = await models.Webhook.findAll({
    where: {
      ...chainOrCommObj,
      categories: {
        [Op.contains]: [content.notificationCategory],
      },
    },
  });
  const chainOrCommwebhookUrls = [];
  chainOrCommWebhooks.forEach((wh) => {
    // We currently only support slack webhooks
    if (validURL(wh.url) && wh.url.indexOf('https://hooks.slack.com/services/') !== -1) {
      chainOrCommwebhookUrls.push(wh.url);
    }
  });

  await Promise.all(chainOrCommwebhookUrls
    .filter((url) => !!url)
    .map(async (url) => {
      // eslint-disable-next-line no-return-await
      return await request.post(url).send(data);
    }));
};

export default send;
