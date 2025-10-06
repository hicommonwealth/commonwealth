import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models, sequelize } from '../../database';
import { authThread } from '../../middleware';
import { verifyDeleteThreadSignature } from '../../middleware/canvas';
import { mustBeAuthorizedThread } from '../../middleware/guards';

export const DeleteThreadErrors = {
  ContestLock: 'Cannot delete thread that is in a contest',
};

export function DeleteThread(): Command<typeof schemas.DeleteThread> {
  return {
    ...schemas.DeleteThread,
    auth: [authThread({ author: true }), verifyDeleteThreadSignature],
    body: async ({ actor, context }) => {
      const { thread } = mustBeAuthorizedThread(actor, context);

      const found = await models.ContestManager.findOne({
        where: { topic_id: thread.topic_id! },
      });
      if (found) throw new InvalidInput(DeleteThreadErrors.ContestLock);

      await sequelize.transaction(async (transaction) => {
        await models.ThreadSubscription.destroy({
          where: { thread_id: thread.id! },
          transaction,
        });

        await models.sequelize.query(
          `
          UPDATE "Threads"
          SET search     = null,
              deleted_at = NOW()
          WHERE id = :threadId
        `,
          { transaction, replacements: { threadId: thread.id } },
        );
      });

      return {
        thread_id: thread.id!,
        canvas_signed_data: thread.canvas_signed_data,
        canvas_msg_id: thread.canvas_msg_id,
        community_id: thread.community_id,
      };
    },
  };
}
