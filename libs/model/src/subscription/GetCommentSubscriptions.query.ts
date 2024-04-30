import { schemas, type Query } from '@hicommonwealth/core';
import { models } from '../database';

export const GetCommentSubscriptions: Query<
  typeof schemas.queries.GetCommentSubscriptions
> = () => ({
  ...schemas.queries.GetCommentSubscriptions,
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
