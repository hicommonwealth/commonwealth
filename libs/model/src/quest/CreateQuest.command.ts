import { Command } from '@hicommonwealth/core';
import { GraphileTaskNames, scheduleTask } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustBeValidDateRange, mustNotExist } from '../middleware/guards';
import { QuestInstance } from '../models/quest';

export function CreateQuest(): Command<typeof schemas.CreateQuest> {
  return {
    ...schemas.CreateQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const {
        community_id,
        name,
        description,
        image_url,
        start_date,
        end_date,
        max_xp_to_end,
      } = payload;

      const existingName = await models.Quest.findOne({
        where: { community_id: community_id ?? null, name },
        attributes: ['id'],
      });
      mustNotExist(
        `Quest named "${name}" in community "${community_id}"`,
        existingName,
      );

      mustBeValidDateRange(start_date, end_date);

      let quest: QuestInstance | undefined;
      await models.sequelize.transaction(async (transaction) => {
        quest = await models.Quest.create(
          {
            name,
            description,
            image_url,
            start_date,
            end_date,
            max_xp_to_end,
            xp_awarded: 0,
            community_id: community_id ?? null,
          },
          { transaction },
        );
        // TODO: schedule if Channel quest
        if (true) {
          await scheduleTask(
            GraphileTaskNames.AwardTwitterQuestXp,
            {
              quest_id: quest.id!,
              quest_end_date: end_date,
            },
            {
              transaction,
            },
          );
        }
      });

      if (!quest) throw new Error('Quest not created');

      return quest.toJSON();
    },
  };
}
