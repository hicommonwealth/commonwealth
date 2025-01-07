import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';

export function DeleteWebhook(): Command<typeof schemas.DeleteWebhook> {
  return {
    ...schemas.DeleteWebhook,
    auth: [authRoles('admin')],
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
