import { type Command } from '@hicommonwealth/core';
import { commands } from '@hicommonwealth/schemas';
import { models } from '../database';

export const DeleteCommentSubscription: Command<
  typeof commands.DeleteCommentSubscription
> = () => ({
  ...commands.DeleteCommentSubscription,
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
