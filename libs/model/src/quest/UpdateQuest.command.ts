import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isSuperAdmin } from '../middleware';
import {
  mustBeValidDateRange,
  mustExist,
  mustNotBeStarted,
  mustNotExist,
} from '../middleware/guards';
import { getDelta } from '../utils';

export function UpdateQuest(): Command<typeof schemas.UpdateQuest> {
  return {
    ...schemas.UpdateQuest,
    auth: [isSuperAdmin],
    secure: true,
    body: async ({ payload }) => {
      const {
        quest_id,
        name,
        description,
        community_id,
        image_url,
        start_date,
        end_date,
        max_xp_to_end,
        action_metas,
      } = payload;

      const quest = await models.Quest.findOne({ where: { id: quest_id } });
      mustExist(`Quest with id "${quest_id}`, quest);

      if (name) {
        const existingName = await models.Quest.findOne({
          where: { community_id: community_id ?? null, name },
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

      if (action_metas) {
        const c_id = community_id || quest.community_id;
        await Promise.all(
          action_metas.map(async (action_meta) => {
            if (action_meta.content_id) {
              // make sure content_id exists
              const [content, id] = action_meta.content_id.split(':'); // this has been validated by the schema
              if (content === 'thread') {
                const thread = await models.Thread.findOne({
                  where: c_id ? { id: +id, community_id: c_id } : { id: +id },
                });
                mustExist(`Thread with id "${id}"`, thread);
              } else if (content === 'comment') {
                const comment = await models.Comment.findOne({
                  where: { id: +id },
                  include: c_id
                    ? [
                        {
                          model: models.Thread,
                          attributes: ['community_id'],
                          required: true,
                          where: { community_id: c_id },
                        },
                      ]
                    : [],
                });
                mustExist(`Comment with id "${id}"`, comment);
              }
            }
          }),
        );
      }

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
          community_id,
          image_url,
          start_date,
          end_date,
          max_xp_to_end,
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
