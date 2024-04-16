import { schemas, type Command } from '@hicommonwealth/core';
import { WhereOptions } from 'sequelize';
import { models } from '../database';
import { CommunityAlertAttributes } from '../models/community_alerts';

export const DeleteCommunityAlerts: Command<
  typeof schemas.commands.DeleteCommunityAlert
> = () => ({
  ...schemas.commands.DeleteCommunityAlert,
  auth: [],
  secure: true,
  body: async ({ payload, actor }) => {
    const where: WhereOptions<CommunityAlertAttributes> = {
      user_id: actor.user.id,
    };

    if ('ids' in payload) {
      where.id = payload.ids;
    } else if ('community_ids' in payload) {
      where.community_id = payload.community_ids;
    }

    return await models.CommunityAlert.destroy({
      where,
    });
  },
});
