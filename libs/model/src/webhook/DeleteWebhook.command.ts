import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';

export function DeleteWebhook(): Command<typeof schemas.DeleteWebhook> {
  return {
    ...schemas.DeleteWebhook,
    auth: [isCommunityAdmin],
    secure: true,
    body: async ({ payload }) => {
      const res = await models.Webhook.destroy({
        where: {
          id: payload.id,
        },
      });
      return {
        webhook_deleted: !!res,
      };
    },
  };
}
