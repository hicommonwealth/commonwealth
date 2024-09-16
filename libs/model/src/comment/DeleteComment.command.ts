import { InvalidActor, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export function DeleteComment(): Command<
  typeof schemas.DeleteComment,
  AuthContext
> {
  return {
    ...schemas.DeleteComment,
    auth: [isAuthorized({})],
    body: async ({ actor, payload, auth }) => {
      const { address } = mustBeAuthorized(actor, auth);
      const { comment_id, message_id } = payload;

      const comment = await models.Comment.findOne({
        where: message_id
          ? { discord_meta: { message_id } }
          : { id: comment_id },
        include: [
          {
            model: models.Thread,
            attributes: ['community_id'],
            required: true,
          },
        ],
        logging: true,
      });
      mustExist('Comment', comment);

      if (comment.address_id !== address!.id && address.role === 'member')
        throw new InvalidActor(actor, 'Not authorized author');

      // == mutation transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        await models.CommentSubscription.destroy({
          where: { comment_id: comment.id },
          transaction,
        });
        await comment.destroy({ transaction });
      });
      // == end of transaction boundary ==

      return { comment_id: comment.id!, canvas_hash: comment.canvas_msg_id };
    },
  };
}
