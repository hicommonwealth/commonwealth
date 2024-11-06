import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';

export function GetQuest(): Query<typeof schemas.GetQuest, AuthContext> {
  return {
    ...schemas.GetQuest,
    auth: [isAuthorized({ roles: ['admin', 'moderator', 'member'] })],
    secure: true,
    body: async ({ payload }) => {
      const { quest_id } = payload;
      const quest = await models.Quest.findOne({
        where: { id: quest_id },
        include: { model: models.QuestActionMeta, as: 'action_metas' },
      });
      return quest
        ? {
            ...quest.toJSON(),
            id: quest_id,
            created_at: quest!.created_at!,
          }
        : undefined;
    },
  };
}
