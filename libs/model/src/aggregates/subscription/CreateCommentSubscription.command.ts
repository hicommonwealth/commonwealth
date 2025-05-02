import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authVerified } from '../../middleware/auth';

export function CreateCommentSubscription(): Command<
  typeof schemas.CreateCommentSubscription
> {
  return {
    ...schemas.CreateCommentSubscription,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      const { 0: subscription } = await models.CommentSubscription.findOrCreate(
        {
          where: {
            user_id: actor.user.id!,
            comment_id: payload.comment_id,
          },
        },
      );
      return subscription.get({ plain: true });
    },
  };
}
