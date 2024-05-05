import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';

const Errors = {
  InvalidTopics: 'Invalid topics',
};

export function UpdateContestManagerMetadata(): Command<
  typeof schemas.UpdateContestManagerMetadata
> {
  return {
    ...schemas.UpdateContestManagerMetadata,
    auth: [isCommunityAdmin],
    body: async ({ id, payload }) => {
      const { topic_ids, ...rest } = payload;

      const contestManager = await models.ContestManager.findOne({
        where: {
          community_id: id,
          contest_address: payload.contest_address,
        },
      });

      if (mustExist('ContestManager', contestManager)) {
        let contestTopicsToCreate: z.infer<
          typeof schemas.entities['ContestTopic']
        >[] = [];

        if (Array.isArray(topic_ids) && topic_ids.length > 0) {
          const topics = await models.Topic.findAll({
            where: {
              id: {
                [Op.in]: topic_ids,
              },
            },
          });

          if (topics.length !== topic_ids.length) {
            throw new InvalidState(Errors.InvalidTopics);
          }

          contestTopicsToCreate = topics.map((t) => ({
            contest_address: contestManager.contest_address,
            topic_id: t.id!,
            created_at: new Date(),
          }));
        }

        const result = await models.sequelize.transaction(
          async (transaction) => {
            if (payload.topic_ids) {
              // destroy all old associations
              await models.ContestTopic.destroy({
                where: {
                  contest_address: payload.contest_address,
                },
                transaction,
              });

              // create new associations
              if (contestTopicsToCreate.length > 0) {
                await models.ContestTopic.bulkCreate(contestTopicsToCreate, {
                  transaction,
                });
              }
            }

            // update metadata
            return contestManager.update(
              {
                ...rest,
              },
              { transaction },
            );
          },
        );

        const contestTopics = await models.ContestTopic.findAll({
          where: { contest_address: contestManager.contest_address },
          include: {
            model: models.Topic,
            as: 'Topic',
          },
        });

        return {
          contest_managers: [
            {
              ...result.get({ plain: true }),
              topics: contestTopics.map((ct) => (ct as any).Topic),
            },
          ],
        };
      }
    },
  };
}
