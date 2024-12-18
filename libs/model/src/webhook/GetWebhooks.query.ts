import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authRoles } from '../middleware';

export function GetWebhooks(): Query<typeof schemas.GetWebhooks> {
  return {
    ...schemas.GetWebhooks,
    auth: [authRoles('admin')],
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
