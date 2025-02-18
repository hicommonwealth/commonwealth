import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

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

      const actions = await models.XpLog.count({
        include: [
          {
            model: models.QuestActionMeta,
            as: 'quest_action_meta',
            where: { quest_id },
          },
        ],
      });
      if (actions > 0)
        throw new Error(
          `Cannot delete quest "${quest_id}" because it has actions`,
        );

      const rows = await models.Quest.destroy({ where: { id: quest_id } });
      return rows > 0;
    },
  };
}
