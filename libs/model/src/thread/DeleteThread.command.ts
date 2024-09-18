import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models, sequelize } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { verifyDeleteThreadSignature } from '../middleware/canvas';
import { mustBeAuthorizedThread } from '../middleware/guards';

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
    auth: [isAuthorized({ author: true }), verifyDeleteThreadSignature],
    body: async ({ actor, auth, payload }) => {
      const { thread } = mustBeAuthorizedThread(actor, auth);

      if (
        payload.canvas_msg_id &&
        thread.canvas_msg_id !== payload.canvas_msg_id
      )
        throw new InvalidInput(DeleteThreadErrors.InvalidCanvasMsgId);

      const found = await models.ContestTopic.findOne({
        where: { topic_id: thread.topic_id! },
      });
      if (found) throw new InvalidInput(DeleteThreadErrors.ContestLock);

      await sequelize.transaction(async (transaction) => {
        await models.ThreadSubscription.destroy({
          where: { thread_id: thread.id! },
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
