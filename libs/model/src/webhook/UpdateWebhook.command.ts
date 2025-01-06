import { InvalidInput, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WebhookDestinations } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';

export const UpdateWebhookErrors = {
  CannotUpdateElizaWebhooks: 'Cannot update Eliza Webhooks',
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

      if (webhook.destination === WebhookDestinations.Eliza) {
        throw new InvalidInput(UpdateWebhookErrors.CannotUpdateElizaWebhooks);
      } else if (payload.events.includes('UserMentioned')) {
        throw new InvalidInput(UpdateWebhookErrors.UnsupportedUserMentioned);
      }

      webhook.events = payload.events;
      await webhook.save();

      return webhook.get({ plain: true });
    },
  };
}
