import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetQuest(): Query<typeof schemas.GetQuest> {
  return {
    ...schemas.GetQuest,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { quest_id } = payload;
      const quest = await models.Quest.findOne({
        where: { id: quest_id },
        include: [
          {
            model: models.QuestActionMeta,
            as: 'action_metas',
            include: [
              {
                model: models.QuestTweets,
                required: false,
              },
              {
                model: models.ChainEventXpSource,
                required: false,
              },
            ],
          },
        ],
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
