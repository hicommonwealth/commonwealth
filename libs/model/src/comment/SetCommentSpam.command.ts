import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';

export const MarkCommentAsSpamErrors = {
  CommentNotFound: 'Could not find Comment',
};

export function SetCommentSpam(): Command<
  typeof schemas.SetCommentSpam,
  AuthContext
> {
  return {
    ...schemas.SetCommentSpam,
    auth: [isAuthorized({ roles: ['admin', 'moderator'] })],
    body: async ({ payload }) => {
      const comment = await models.Comment.findOne({
        where: { id: payload.comment_id },
        include: [{ model: models.Thread, attributes: ['community_id'] }],
      });
      if (!comment) {
        throw new InvalidState(MarkCommentAsSpamErrors.CommentNotFound);
      }

      if (payload.spam && !comment.marked_as_spam_at) {
        comment.marked_as_spam_at = new Date();
        await comment.save();
      } else if (!payload.spam && comment.marked_as_spam_at) {
        comment.marked_as_spam_at = null;
        await comment.save();
      }

      return comment;
    },
  };
}
