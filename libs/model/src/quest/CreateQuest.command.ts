import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import { mustNotExist } from '../middleware/guards';

export function CreateQuest(): Command<
  typeof schemas.CreateQuest,
  AuthContext
> {
  return {
    ...schemas.CreateQuest,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, name, description, start_date, end_date } = payload;

      const existingName = await models.Quest.findOne({
        where: { community_id, name },
        attributes: ['id'],
      });
      mustNotExist(
        `Quest named "${name}" in community "${community_id}"`,
        existingName,
      );

      return await models.Quest.create({
        community_id,
        name,
        description,
        start_date,
        end_date,
      });
    },
  };
}
