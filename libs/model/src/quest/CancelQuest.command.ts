import { Command } from '@hicommonwealth/core';
import { removeJob } from '@hicommonwealth/model';
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

      const quest = await models.Quest.scope('withPrivateData').findOne({
        where: { id: quest_id },
        attributes: ['start_date'],
      });
      mustExist(`Quest "${quest_id}"`, quest);

      let rows: [number] | undefined;
      await models.sequelize.transaction(async (transaction) => {
        if (quest.scheduled_job_id) {
          await removeJob({
            jobId: quest.scheduled_job_id,
            transaction,
          });
        }

        rows = await models.Quest.update(
          { end_date: sequelize.literal('NOW()') },
          { where: { id: quest_id } },
        );
      });

      return rows ? rows[0] > 0 : false;
    },
  };
}
