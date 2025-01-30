import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import { mustBeValidDateRange, mustNotExist } from '../middleware/guards';

export function CreateQuest(): Command<typeof schemas.CreateQuest> {
  return {
    ...schemas.CreateQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, name, description, start_date, end_date } = payload;

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
        start_date,
        end_date,
        community_id: community_id ?? null,
      });
      return quest.toJSON();
    },
  };
}
