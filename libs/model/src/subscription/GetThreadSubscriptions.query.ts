import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetThreadSubscriptions(): Query<
  typeof schemas.GetThreadSubscriptions
> {
  return {
    ...schemas.GetThreadSubscriptions,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        await models.ThreadSubscription.findAll({
          where: {
            user_id: actor.user.id,
          },
        })
      ).map((subscription) => subscription.get({ plain: true }));
    },
  };
}
