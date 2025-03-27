import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';

export function DeleteCommunityAlerts(): Command<
  typeof schemas.DeleteCommunityAlert
> {
  return {
    ...schemas.DeleteCommunityAlert,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      return await models.CommunityAlert.destroy({
        where: {
          user_id: actor.user.id,
          community_id: payload.community_ids,
        },
      });
    },
  };
}
