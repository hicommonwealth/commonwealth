import { Command, InvalidActor, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models, sequelize } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';

export const DeleteThreadErrors = {
  InvalidCanvasMsgId: 'Invalid canvas_msg_id',
  ContestLock: 'Cannot delete thread that is in a contest',
};

export function DeleteThread(): Command<
  typeof schemas.DeleteThread,
  AuthContext
> {
  return {
    ...schemas.DeleteThread,
    auth: [isAuthorized({})],
    body: async ({ actor, auth, payload }) => {
      const { address } = mustBeAuthorized(actor, auth);
      const { thread_id, message_id, canvas_msg_id } = payload;

      const thread = await models.Thread.findOne({
        where: message_id
          ? { discord_meta: { message_id } }
          : { id: thread_id },
        include: [
          {
            model: models.Topic,
            as: 'topic',
            include: [{ model: models.ContestTopic, as: 'contest_topics' }],
          },
        ],
      });
      mustExist('Thread', thread);

      if (thread.address_id !== address.id && address.role === 'member')
        throw new InvalidActor(actor, 'Not authorized author');

      if (canvas_msg_id && thread.canvas_msg_id !== canvas_msg_id)
        throw new InvalidInput(DeleteThreadErrors.InvalidCanvasMsgId);

      if (thread.topic?.contest_topics?.length)
        throw new InvalidInput(DeleteThreadErrors.ContestLock);

      await sequelize.transaction(async (transaction) => {
        await models.ThreadSubscription.destroy({
          where: {
            thread_id: thread.id!,
          },
          transaction,
        });

        await thread.destroy({ transaction });
      });

      return {
        thread_id: thread.id!,
        canvas_signed_data: thread.canvas_signed_data,
        canvas_msg_id: thread.canvas_msg_id,
      };
    },
  };
}
