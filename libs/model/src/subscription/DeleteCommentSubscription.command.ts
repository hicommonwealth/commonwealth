import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function DeleteCommentSubscription(): Command<
  typeof schemas.DeleteCommentSubscription
> {
  return {
    ...schemas.DeleteCommentSubscription,
    auth: [],
    secure: true,
    body: async ({ payload, actor }) => {
      return await models.CommentSubscription.destroy({
        where: {
          user_id: actor.user.id!,
          comment_id: payload.comment_ids,
        },
      });
    },
  };
}
