import { type Query } from '@hicommonwealth/core';
import { queries } from '@hicommonwealth/shared';
import { models } from '../database';

export const GetThreadSubscriptions: Query<
  typeof queries.GetThreadSubscriptions
> = () => ({
  ...queries.GetThreadSubscriptions,
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
