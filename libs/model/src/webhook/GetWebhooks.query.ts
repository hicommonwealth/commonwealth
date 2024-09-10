import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

export function GetWebhooks(): Query<typeof schemas.GetWebhooks, AuthContext> {
  return {
    ...schemas.GetWebhooks,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const webhooks = await models.Webhook.findAll({
        where: {
          community_id: payload.community_id,
        },
      });
      return webhooks.map((w) => w.get({ plain: true }));
    },
  };
}
