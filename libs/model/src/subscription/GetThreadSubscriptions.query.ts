import { schemas, type Query } from '@hicommonwealth/core';
import { models } from '../database';

export const GetThreadSubscriptions: Query<
  typeof schemas.queries.GetThreadSubscriptions
> = () => ({
  ...schemas.queries.GetThreadSubscriptions,
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
});
