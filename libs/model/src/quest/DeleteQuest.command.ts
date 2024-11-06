import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustExist, mustNotBeStarted } from '../middleware/guards';

export function DeleteQuest(): Command<
  typeof schemas.DeleteQuest,
  AuthContext
> {
  return {
    ...schemas.DeleteQuest,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, quest_id } = payload;

      const quest = await models.Quest.findOne({
        where: { community_id, id: quest_id },
        attributes: ['start_date'],
      });
      mustExist(`Quest "${quest_id}" in community "${community_id}"`, quest);

      mustNotBeStarted(quest.start_date);

      const rows = await models.Quest.destroy({
        where: { community_id, id: quest_id },
      });
      return rows > 0;
    },
  };
}
