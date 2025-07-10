import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

const cleanChainEventXpSources = async () => {
  const res = await models.sequelize.query(
    `
        UPDATE "ChainEventXpSources" CE
        SET active = false
        FROM "QuestActionMetas" QAM,
             "Quests" Q
        WHERE QAM.id = CE.quest_action_meta_id
          AND QAM.quest_id = Q.id
          AND Q.end_date < NOW()
          AND CE.active = true;
    `,
    { type: QueryTypes.BULKDELETE },
  );
  log.info(`Deactivated ${res} chain event XP sources`);
};

export const cleanChainEventXpSourcesTask = {
  input: TaskPayloads.CleanChainEventXpSources,
  fn: cleanChainEventXpSources,
};
