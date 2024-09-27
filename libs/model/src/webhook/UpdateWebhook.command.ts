import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

export function UpdateWebhook(): Command<
  typeof schemas.UpdateWebhook,
  AuthContext
> {
  return {
    ...schemas.UpdateWebhook,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const webhook = await models.Webhook.findByPk(payload.id);
      if (!webhook) throw new InvalidState('Webhook does not exist');

      webhook.events = payload.events;
      await webhook.save();

      return webhook.get({ plain: true });
    },
  };
}
