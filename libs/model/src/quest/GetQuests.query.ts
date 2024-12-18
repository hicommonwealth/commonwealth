import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetQuests(): Query<typeof schemas.GetQuests> {
  return {
    ...schemas.GetQuests,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { community_id } = payload;
      const quests = await models.Quest.findAll({
        where: { community_id },
        include: { model: models.QuestActionMeta, as: 'action_metas' },
      });
      return (
        quests?.map((q) => ({
          ...q.toJSON(),
          // enforce view schema
          id: q.id!,
          created_at: q.created_at!,
        })) ?? []
      );
    },
  };
}
