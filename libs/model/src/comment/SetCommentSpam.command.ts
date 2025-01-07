import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { authComment } from '../middleware';
import { mustBeAuthorizedComment } from '../middleware/guards';

export function SetCommentSpam(): Command<typeof schemas.SetCommentSpam> {
  return {
    ...schemas.SetCommentSpam,
    auth: [authComment({ author: true })],
    body: async ({ actor, payload, context }) => {
      const { comment } = mustBeAuthorizedComment(actor, context);

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
