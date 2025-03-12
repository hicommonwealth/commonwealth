import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';
import { mustBeValidDateRange, mustNotExist } from '../../middleware/guards';

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
        quest_type,
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

      const quest = await models.Quest.create({
        name,
        description,
        image_url,
        start_date,
        end_date,
        max_xp_to_end,
        xp_awarded: 0,
        community_id: community_id ?? null,
        quest_type,
      });

      const jsonQuest = quest.toJSON();
      delete jsonQuest.scheduled_job_id;
      return jsonQuest;
    },
  };
}
