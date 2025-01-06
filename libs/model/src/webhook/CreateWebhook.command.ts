import {
  InvalidInput,
  InvalidState,
  logger,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WebhookSupportedEvents } from '@hicommonwealth/schemas';
import {
  WebhookDestinations,
  getElizaUserId,
  getWebhookDestination,
} from '@hicommonwealth/shared';
import fetch from 'node-fetch';
import { z } from 'zod';
import { models } from '../database';
import { authRoles } from '../middleware';

const log = logger(import.meta);

const Errors = {
  InvalidWebhookUrl:
    'Invalid Webhook url. Must be one of: https://api.telegram.org/*, ' +
    'https://hooks.slack.com/services/*, https://hooks.zapier.com/hooks/*, https://discord.com/api/webhooks/*, https://*/eliza/[user-id]',
  WebhookExists: 'The provided webhook already exists for this community',
  MissingChannelIdTelegram: 'The Telegram url is missing a channel id',
  WebhookNotFound: 'The Webhook does not exist',
  UnauthorizedWebhooks: 'Cannot make requests to unauthorized webhooks',
  ElizaUserNotFound: 'Eliza user not found',
  ElizaAddressNotFound: 'Eliza address not found',
};

export function CreateWebhook(): Command<typeof schemas.CreateWebhook> {
  return {
    ...schemas.CreateWebhook,
    auth: [authRoles('admin')],
    secure: true,
    body: async ({ payload }) => {
      const destination = getWebhookDestination(payload.webhookUrl);

      if (destination === WebhookDestinations.Unknown)
        throw new InvalidInput(Errors.InvalidWebhookUrl);

      const existingWebhook = await models.Webhook.findOne({
        where: {
          community_id: payload.community_id,
          destination,
          url: payload.webhookUrl,
        },
      });

      if (existingWebhook) throw new InvalidState(Errors.WebhookExists);

      // Telegram webhook urls are a workaround (all we need is the chat/group id)
      if (destination !== WebhookDestinations.Telegram) {
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

      const events: z.infer<typeof WebhookSupportedEvents>[] = [];
      if (destination === WebhookDestinations.Eliza) {
        const elizaUserId = getElizaUserId(payload.webhookUrl);
        const elizaUser = await models.User.findOne({
          where: {
            id: elizaUserId,
          },
          include: [
            {
              model: models.Address,
              required: false,
              where: {
                community_id: payload.community_id,
              },
            },
          ],
        });
        if (!elizaUser) throw new InvalidState(Errors.ElizaUserNotFound);
        if (
          !Array.isArray(elizaUser.Addresses) ||
          elizaUser.Addresses.length < 1
        )
          throw new InvalidState(Errors.ElizaAddressNotFound);

        // automatically add UserMentioned for Eliza Webhooks
        events.push('UserMentioned');
      }

      const webhook = await models.Webhook.create({
        community_id: payload.community_id,
        url: payload.webhookUrl,
        destination,
        events,
      });

      return webhook.get({ plain: true });
    },
  };
}
