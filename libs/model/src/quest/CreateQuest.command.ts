import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';

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

      // TODO: validate unique name in community

      const quest = await models.Quest.create({
        community_id,
        name,
        description,
        start_date,
        end_date,
      });

      return quest;
    },
  };
}
