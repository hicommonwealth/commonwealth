import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authComment } from '../../middleware';
import { mustBeAuthorizedComment } from '../../middleware/guards';
import { getCommentSearchVector } from '../../models';

export function ToggleCommentSpam(): Command<typeof schemas.ToggleCommentSpam> {
  return {
    ...schemas.ToggleCommentSpam,
    auth: [
      authComment({ author: true, roles: ['admin', 'moderator', 'member'] }),
    ],
    body: async ({ actor, payload, context }) => {
      const { comment, community_id } = mustBeAuthorizedComment(actor, context);
      let spamToggled = false;

      if (payload.spam && !comment.marked_as_spam_at) {
        comment.marked_as_spam_at = new Date();
        comment.search = null;
        await comment.save();
        spamToggled = true;
      } else if (!payload.spam && comment.marked_as_spam_at) {
        // Update search index when unmarking as spam
        let body = comment.body;
        if (comment.content_url) {
          const res = await fetch(comment.content_url);
          body = await res.text();
        }
        comment.search = getCommentSearchVector(body);
        comment.marked_as_spam_at = null;
        await comment.save();
        spamToggled = true;
      }

      const address = await models.Address.findOne({
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
      const formattedComment = comment.get({ plain: true });
      if (address) formattedComment.Address = address.get({ plain: true });

      return { ...formattedComment, community_id, spam_toggled: spamToggled };
    },
  };
}
