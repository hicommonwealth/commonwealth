import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ExternalApiQuestNames } from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export function VerifyQuestAction(): Command<typeof schemas.VerifyQuestAction> {
  return {
    ...schemas.VerifyQuestAction,
    auth: [],
    secure: true,
    body: async ({ payload }) => {
      const { quest_action_meta_id } = payload;
      const questActionMeta = await models.QuestActionMeta.findOne({
        where: { id: quest_action_meta_id },
      });
      mustExist(`QuestActionMeta ${quest_action_meta_id}`, questActionMeta);

      if (
        !ExternalApiQuestNames.includes(
          questActionMeta.event_name as (typeof ExternalApiQuestNames)[number],
        )
      ) {
        throw new InvalidInput(`Can't manually verify this quest action`);
      }
    },
  };
}
