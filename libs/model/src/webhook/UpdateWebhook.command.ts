import { InvalidInput, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WebhookDestinations } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';

export const UpdateWebhookErrors = {
  OnlyUserMentioned: 'Only UserMentioned is supported for Eliza webhooks',
  UnsupportedUserMentioned:
    'UserMentioned not supported for non-Eliza webhooks',
};

export function UpdateWebhook(): Command<typeof schemas.UpdateWebhook> {
  return {
    ...schemas.UpdateWebhook,
    auth: [authRoles('admin')],
    secure: true,
    body: async ({ payload }) => {
      const webhook = await models.Webhook.findByPk(payload.id);
      if (!webhook) throw new InvalidState('Webhook does not exist');

      if (
        (webhook.destination === WebhookDestinations.Eliza &&
          payload.events.length !== 1) ||
        !payload.events.includes('UserMentioned')
      ) {
        throw new InvalidInput(UpdateWebhookErrors.OnlyUserMentioned);
      } else if (
        webhook.destination !== WebhookDestinations.Eliza &&
        payload.events.includes('UserMentioned')
      ) {
        throw new InvalidInput(UpdateWebhookErrors.UnsupportedUserMentioned);
      }

      webhook.events = payload.events;
      await webhook.save();

      return webhook.get({ plain: true });
    },
  };
}
