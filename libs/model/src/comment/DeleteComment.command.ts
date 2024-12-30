import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authComment } from '../middleware';
import { mustBeAuthorizedComment } from '../middleware/guards';

export function DeleteComment(): Command<typeof schemas.DeleteComment> {
  return {
    ...schemas.DeleteComment,
    auth: [authComment({ author: true })],
    body: async ({ actor, context }) => {
      const { comment } = mustBeAuthorizedComment(actor, context);

      // == mutation transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        await models.CommentSubscription.destroy({
          where: { comment_id: comment.id },
          transaction,
        });

        if (comment.parent_id) {
          const parent = await models.Comment.findOne({
            where: { id: comment.parent_id },
            include: [models.Address],
          });

          if (parent) {
            parent.reply_count -= 1;
            await parent.save({ transaction });
          }
        }

        await comment.destroy({ transaction });
      });
      // == end of transaction boundary ==

      return {
        comment_id: comment.id!,
        canvas_signed_data: comment.canvas_signed_data,
        canvas_msg_id: comment.canvas_msg_id,
      };
    },
  };
}
