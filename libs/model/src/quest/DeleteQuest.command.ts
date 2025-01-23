import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustExist, mustNotBeStarted } from '../middleware/guards';

export function DeleteQuest(): Command<typeof schemas.DeleteQuest> {
  return {
    ...schemas.DeleteQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { quest_id } = payload;

      const quest = await models.Quest.findOne({
        where: { id: quest_id },
        attributes: ['start_date'],
      });
      mustExist(`Quest "${quest_id}"`, quest);

      mustNotBeStarted(quest.start_date);

      const rows = await models.Quest.destroy({ where: { id: quest_id } });
      return rows > 0;
    },
  };
}
