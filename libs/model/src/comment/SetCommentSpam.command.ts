import { type Command } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { authComment } from '../middleware';
import { mustBeAuthorizedComment } from '../middleware/guards';

export function SetCommentSpam(): Command<typeof schemas.SetCommentSpam> {
  return {
    ...schemas.SetCommentSpam,
    auth: [
      authComment({ author: true, roles: ['admin', 'moderator', 'member'] }),
    ],
    body: async ({ actor, payload, context }) => {
      const { comment } = mustBeAuthorizedComment(actor, context);

      if (payload.spam && !comment.marked_as_spam_at) {
        comment.marked_as_spam_at = new Date();
        await comment.save();
      } else if (!payload.spam && comment.marked_as_spam_at) {
        comment.marked_as_spam_at = null;
        await comment.save();
      }

      comment.Address = await models.Address.findOne({
        where: {
          id: comment.address_id,
        },
        include: [
          {
            model: models.User,
            required: true,
          },
        ],
      });

      return comment;
    },
  };
}
