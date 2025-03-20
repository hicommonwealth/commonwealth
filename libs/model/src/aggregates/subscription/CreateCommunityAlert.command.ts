import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';

export function CreateCommunityAlert(): Command<
  typeof schemas.CreateCommunityAlert
> {
  return {
    ...schemas.CreateCommunityAlert,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      const { 0: alert } = await models.CommunityAlert.findOrCreate({
        where: {
          user_id: actor.user.id!,
          community_id: payload.community_id,
        },
      });
      return alert.get({ plain: true });
    },
  };
}
