import { schemas, type Command } from '@hicommonwealth/core';
import { models } from '../database';

export const DeleteCommentSubscription: Command<
  typeof schemas.commands.DeleteCommentSubscription
> = () => ({
  ...schemas.commands.DeleteCommentSubscription,
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
});
