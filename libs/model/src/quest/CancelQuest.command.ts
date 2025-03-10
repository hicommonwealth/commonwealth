import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models, sequelize } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

export function CancelQuest(): Command<typeof schemas.CancelQuest> {
  return {
    ...schemas.CancelQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { quest_id } = payload;

      const quest = await models.Quest.findOne({
        where: { id: quest_id },
        attributes: ['start_date'],
      });
      mustExist(`Quest "${quest_id}"`, quest);

      const [rows] = await models.Quest.update(
        { end_date: sequelize.literal('NOW()') },
        { where: { id: quest_id } },
      );
      return rows > 0;
    },
  };
}
