import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetCommentSubscriptions(): Query<
  typeof schemas.GetCommentSubscriptions
> {
  return {
    ...schemas.GetCommentSubscriptions,
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
  };
}
