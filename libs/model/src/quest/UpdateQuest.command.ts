import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';
import {
  mustBeValidDateRange,
  mustExist,
  mustNotBeStarted,
  mustNotExist,
} from '../middleware/guards';
import { getDelta } from '../utils';

export function UpdateQuest(): Command<
  typeof schemas.UpdateQuest,
  AuthContext
> {
  return {
    ...schemas.UpdateQuest,
    auth: [isAuthorized({ roles: ['admin'] })],
    secure: true,
    body: async ({ payload }) => {
      const {
        community_id,
        quest_id,
        name,
        description,
        start_date,
        end_date,
        action_metas,
      } = payload;

      const quest = await models.Quest.findOne({
        where: { community_id, id: quest_id },
      });
      mustExist(`Quest with id "${quest_id}`, quest);

      if (name) {
        const existingName = await models.Quest.findOne({
          where: { community_id, name },
          attributes: ['id'],
        });
        mustNotExist(
          `Quest named "${name}" in community "${community_id}"`,
          existingName,
        );
      }

      mustNotBeStarted(start_date ?? quest.start_date);
      mustBeValidDateRange(
        start_date ?? quest.start_date,
        end_date ?? quest.end_date,
      );

      await models.sequelize.transaction(async (transaction) => {
        if (action_metas?.length) {
          // clean existing action_metas
          await models.QuestActionMeta.destroy({
            where: { quest_id },
            transaction,
          });
          // create new action_metas
          await models.QuestActionMeta.bulkCreate(
            action_metas.map((action_meta) => ({
              ...action_meta,
              quest_id,
            })),
          );
        }

        const delta = getDelta(quest, {
          name,
          description,
          start_date,
          end_date,
        });
        if (Object.keys(delta).length)
          await models.Quest.update(delta, {
            where: { id: quest_id },
            transaction,
          });
      });

      const updated = await models.Quest.findOne({
        where: { id: quest_id },
        include: { model: models.QuestActionMeta, as: 'action_metas' },
      });
      return updated!.toJSON();
    },
  };
}
