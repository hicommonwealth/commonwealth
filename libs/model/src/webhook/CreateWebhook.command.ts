import {
  InvalidInput,
  InvalidState,
  logger,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { getWebhookDestination } from '@hicommonwealth/shared';
import fetch from 'node-fetch';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

const log = logger(import.meta);

const Errors = {
  InvalidWebhookUrl:
    'Invalid Webhook url. Must be one of: https://api.telegram.org/*, ' +
    'https://hooks.slack.com/services/*, https://hooks.zapier.com/hooks/*, https://discord.com/api/webhooks/*',
  WebhookExists: 'The provided webhook already exists for this community',
  MissingChannelIdTelegram: 'The Telegram url is missing a channel id',
  WebhookNotFound: 'The Webhook does not exist',
  UnauthorizedWebhooks: 'Cannot make requests to unauthorized webhooks',
};

export function CreateWebhook(): Command<
  typeof schemas.CreateWebhook,
  AuthContext
> {
  return {
    ...schemas.CreateWebhook,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const destination = getWebhookDestination(payload.webhookUrl);

      if (destination === 'unknown')
        throw new InvalidInput(Errors.InvalidWebhookUrl);

      const existingWebhook = await models.Webhook.findOne({
        where: {
          community_id: payload.id,
          destination,
          url: payload.webhookUrl,
        },
      });

      if (existingWebhook) throw new InvalidState(Errors.WebhookExists);

      // Telegram webhook urls are a workaround (all we need is the chat/group id)
      if (destination !== 'telegram') {
        let res: fetch.Response;
        try {
          res = await fetch(payload.webhookUrl, { method: 'GET' });
        } catch (e) {
          log.error('Failed to check webhook status');
          throw new InvalidState('Failed to check Webhook status');
        }

        if (res.status === 404) {
          throw new InvalidInput(Errors.WebhookNotFound);
        } else if (res.status === 401) {
          throw new InvalidInput(Errors.UnauthorizedWebhooks);
        }
      }

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
