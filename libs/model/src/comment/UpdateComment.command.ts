import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorizedComment } from '../middleware/guards';
import { getCommentSearchVector } from '../models';
import {
  decodeContent,
  emitMentions,
  findMentionDiff,
  parseUserMentions,
  quillToPlain,
  uniqueMentions,
} from '../utils';

export function UpdateComment(): Command<
  typeof schemas.UpdateComment,
  AuthContext
> {
  return {
    ...schemas.UpdateComment,
    auth: [isAuthorized({ author: true })],
    body: async ({ actor, payload, auth }) => {
      const { address, comment } = mustBeAuthorizedComment(actor, auth);

      const thread = comment.Thread!;
      const currentVersion = await models.CommentVersionHistory.findOne({
        where: { comment_id: comment.id },
        order: [['timestamp', 'DESC']],
      });

      if (currentVersion?.text !== payload.text) {
        const text = decodeContent(payload.text);
        const plaintext = quillToPlain(text);
        const mentions = findMentionDiff(
          parseUserMentions(currentVersion?.text),
          uniqueMentions(parseUserMentions(text)),
        );

        // == mutation transaction boundary ==
        await models.sequelize.transaction(async (transaction) => {
          await models.Comment.update(
            { text, plaintext, search: getCommentSearchVector(text) },
            { where: { id: comment.id }, transaction },
          );

          await models.CommentVersionHistory.create(
            { comment_id: comment.id!, text, timestamp: new Date() },
            { transaction },
          );

          mentions.length &&
            (await emitMentions(models, transaction, {
              authorAddressId: address.id!,
              authorUserId: actor.user.id!,
              authorAddress: address.address,
              mentions,
              comment,
              community_id: thread.community_id,
            }));
        });
        // == end of transaction boundary ==
      }

      const _comment = await models.Comment.findOne({
        where: { id: comment.id },
        include: [
          { model: models.Address, include: [models.User] },
          { model: models.CommentVersionHistory },
        ],
      });
      return {
        ..._comment!.toJSON(),
        community_id: thread.community_id,
      };
    },
  };
}
