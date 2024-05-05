import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export const GetCommunityAlerts: Query<
  typeof schemas.GetCommunityAlerts
> = () => ({
  ...schemas.GetCommunityAlerts,
  auth: [],
  secure: true,
  body: async ({ actor }) => {
    return (
      await models.CommunityAlert.findAll({
        where: {
          user_id: actor.user.id,
        },
      })
    ).map((alert) => alert.get({ plain: true }));
  },
});
