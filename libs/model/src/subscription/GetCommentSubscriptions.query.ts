import { type Query } from '@hicommonwealth/core';
import { queries } from '@hicommonwealth/schemas';
import { models } from '../database';

export const GetCommentSubscriptions: Query<
  typeof queries.GetCommentSubscriptions
> = () => ({
  ...queries.GetCommentSubscriptions,
  auth: [],
  secure: true,
  body: async ({ actor }) => {
    return (
      await models.CommentSubscription.findAll({
        where: {
          user_id: actor.user.id,
        },
      })
    ).map((subscription) => subscription.get({ plain: true }));
  },
});
