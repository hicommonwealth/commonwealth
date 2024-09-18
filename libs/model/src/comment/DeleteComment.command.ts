import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorizedComment } from '../middleware/guards';

export function DeleteComment(): Command<
  typeof schemas.DeleteComment,
  AuthContext
> {
  return {
    ...schemas.DeleteComment,
    auth: [isAuthorized({ author: true })],
    body: async ({ actor, auth }) => {
      const { comment } = mustBeAuthorizedComment(actor, auth);

      // == mutation transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        await models.CommentSubscription.destroy({
          where: { comment_id: comment.id },
          transaction,
        });
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
