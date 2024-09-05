import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';

export function UpdateWebhook(): Command<typeof schemas.UpdateWebhook> {
  return {
    ...schemas.UpdateWebhook,
    auth: [isCommunityAdmin],
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
