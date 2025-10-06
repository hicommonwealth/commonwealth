import { type Command, stats } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authComment } from '../../middleware';
import { mustBeAuthorizedComment } from '../../middleware/guards';

export function DeleteComment(): Command<typeof schemas.DeleteComment> {
  return {
    ...schemas.DeleteComment,
    auth: [authComment({ author: true, roles: ['admin', 'moderator'] })],
    body: async ({ actor, context }) => {
      const { comment, community_id } = mustBeAuthorizedComment(actor, context);

      // == mutation transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        await models.CommentSubscription.destroy({
          where: { comment_id: comment.id },
          transaction,
        });

        // Note: not updating reply count here, since our comment
        // comment deleteion strategy is "paranoid". The correct
        // reply count (indicating all the replies even if deleted)
        // is used for client side pagination to correctly render
        // deleted comment reply trees. Uncomment this if the startegy
        // ever changes.
        // if (comment.parent_id) {
        //   const parent = await models.Comment.findOne({
        //     where: { id: comment.parent_id },
        //     include: [models.Address],
        //   });

        //   if (parent) {
        //     parent.reply_count -= 1;
        //     await parent.save({ transaction });
        //   }
        // }

        // Update the comment to mark it as deleted
        await models.sequelize.query(
          `
          UPDATE "Comments"
          SET search = null,
              deleted_at = NOW()
          WHERE id = :commentId;
        `,
          { replacements: { commentId: comment.id }, transaction },
        );

        // Decrement the thread's net comment count since we're using paranoid deletion
        // and the afterDestroy hook won't be triggered. Keep comment_count unchanged
        // as it's used for frontend pagination of the comment tree.
        await models.Thread.update(
          {
            net_comment_count: models.sequelize.literal(
              'net_comment_count - 1',
            ),
          },
          {
            where: { id: comment.thread_id },
            transaction,
          },
        );

        // Track stats for comment count decrement (consistent with afterDestroy hook)
        stats().decrement('cw.hook.comment-count', {
          thread_id: String(comment.thread_id),
        });
      });

      return {
        comment_id: comment.id!,
        thread_id: comment.thread_id,
        community_id,
        body: comment.body,
        marked_as_spam_at: comment.marked_as_spam_at,
        user_tier_at_creation: comment.user_tier_at_creation,
        canvas_signed_data: comment.canvas_signed_data,
        canvas_msg_id: comment.canvas_msg_id,
      };
    },
  };
}
