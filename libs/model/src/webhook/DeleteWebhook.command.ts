import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

export function DeleteWebhook(): Command<
  typeof schemas.DeleteWebhook,
  AuthContext
> {
  return {
    ...schemas.DeleteWebhook,
    auth: [isAuthorized({ roles: ['admin'] })],
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
