import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';

export const DeleteCommunityAlerts: Command<
  typeof schemas.commands.DeleteCommunityAlert
> = () => ({
  ...schemas.commands.DeleteCommunityAlert,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    return await models.CommunityAlert.destroy({
      where: {
        user_id: actor.user.id,
        community_id: payload.community_ids,
      },
    });
  },
});
