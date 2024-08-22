import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';

export const Errors = {
  InvalidWebhookUrl:
    'Invalid Webhook url. Must be one of: https://api.telegram.org/*, ' +
    'https://hooks.slack.com/services/*, https://hooks.zapier.com/hooks/*, https://api.telegram.org/*',
  WebhookExists: 'The provided webhook already exists for this community',
};

export function CreateWebhook(): Command<typeof schemas.CreateWebhook> {
  return {
    ...schemas.CreateWebhook,
    auth: [isCommunityAdmin],
    secure: true,
    body: async ({ payload }) => {
      let destination = 'unknown';
      if (payload.webhookUrl.startsWith('https://discord.com/api/webhooks/'))
        destination = 'discord';
      else if (
        payload.webhookUrl.startsWith('https://hooks.slack.com/services/')
      )
        destination = 'slack';
      else if (payload.webhookUrl.startsWith('https://hooks.zapier.com/hooks/'))
        destination = 'zapier';
      else if (payload.webhookUrl.startsWith('https://api.telegram.org/'))
        destination = 'telegram';

      if (destination === 'unknown')
        throw new InvalidState(Errors.InvalidWebhookUrl);

      const existingWebhook = await models.Webhook.findOne({
        where: {
          community_id: payload.id,
          destination,
          url: payload.webhookUrl,
        },
      });

      if (existingWebhook) throw new InvalidState(Errors.WebhookExists);

      const webhook = await models.Webhook.create({
        community_id: payload.id,
        url: payload.webhookUrl,
        destination,
        events: [],
      });

      return webhook.get({ plain: true });
    },
  };
}
