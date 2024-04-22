import { schemas, type Query } from '@hicommonwealth/core';
import { models } from '../database';

export const GetCommunityAlerts: Query<
  typeof schemas.queries.GetCommunityAlerts
> = () => ({
  ...schemas.queries.GetCommunityAlerts,
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
