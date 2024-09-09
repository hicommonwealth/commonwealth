import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';
import {
  emitMentions,
  findMentionDiff,
  parseUserMentions,
  quillToPlain,
  sanitizeQuillText,
  uniqueMentions,
} from '../utils';

export function UpdateComment(): Command<
  typeof schemas.UpdateComment,
  AuthContext
> {
  return {
    ...schemas.UpdateComment,
    auth: [isAuthorized({})],
    body: async ({ actor, payload }) => {
      const { comment_id, discord_meta } = payload;

      const comment = await models.Comment.findOne({
        where: comment_id ? { id: comment_id } : { discord_meta },
        include: [{ model: models.Thread, required: true }],
      });
      mustExist('Comment', comment);
      const thread = comment.Thread!;

      const currentVersion = await models.CommentVersionHistory.findOne({
        where: { comment_id: comment.id },
        order: [['timestamp', 'DESC']],
      });

      if (currentVersion?.text !== payload.text) {
        const address = await models.Address.findOne({
          where: {
            community_id: thread.community_id,
            user_id: actor.user.id,
            address: actor.address,
          },
        });
        mustExist('Community address', address);

        const text = sanitizeQuillText(payload.text);
        const plaintext = quillToPlain(text);
        const mentions = findMentionDiff(
          parseUserMentions(currentVersion?.text),
          uniqueMentions(parseUserMentions(text)),
        );

        // == mutation transaction boundary ==
        await models.sequelize.transaction(async (transaction) => {
          await models.Comment.update(
            { text, plaintext },
            { where: { id: comment.id }, transaction },
          );

          await models.CommentVersionHistory.create(
            { comment_id: comment.id!, text, timestamp: new Date() },
            { transaction },
          );

          // update timestamps
          address.last_active = new Date();
          await address.save({ transaction });

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
