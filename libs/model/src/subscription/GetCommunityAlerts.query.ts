import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

const associationParams = [
  {
    model: models.Community,
    as: 'Community',
  },
];

export function GetCommunityAlerts(): Query<typeof schemas.GetCommunityAlerts> {
  return {
    ...schemas.GetCommunityAlerts,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        await models.CommunityAlert.findAll({
          where: {
            user_id: actor.user.id,
          },
          //include: [...associationParams],
          logging: console.log,
        })
      ).map((alert) => alert.get({ plain: true }));
    },
  };
}
