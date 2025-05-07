import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import {
  authThread,
  mustBeAuthorizedThread,
  mustExist,
} from '../../middleware';

export function DeletePoll(): Command<typeof schemas.DeletePoll> {
  return {
    ...schemas.DeletePoll,
    auth: [authThread({ author: true })],
    body: async ({ actor, payload, context }) => {
      const { thread } = mustBeAuthorizedThread(actor, context);
      const { poll_id } = payload;

      const poll = await models.Poll.findByPk(poll_id);
      mustExist('Poll', poll);

      await models.sequelize.transaction(async (transaction) => {
        await models.Vote.destroy({ where: { poll_id }, transaction });
        await poll.destroy({ transaction });
        thread.has_poll = false;
        await thread.save({ transaction });
      });

      return true;
    },
  };
}
