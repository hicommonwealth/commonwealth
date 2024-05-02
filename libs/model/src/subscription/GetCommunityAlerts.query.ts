import { type Query } from '@hicommonwealth/core';
import { queries } from '@hicommonwealth/schemas';
import { models } from '../database';

export const GetCommunityAlerts: Query<
  typeof queries.GetCommunityAlerts
> = () => ({
  ...queries.GetCommunityAlerts,
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
