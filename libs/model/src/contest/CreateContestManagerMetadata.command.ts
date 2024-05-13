import type { Command } from '@hicommonwealth/core';
import { InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import z from 'zod';
import { models } from '../database';
import { isCommunityAdmin } from '../middleware';
import { mustExist } from '../middleware/guards';
import { TopicAttributes } from '../models';

const Errors = {
  InvalidTopics: 'Invalid topics',
};

export function CreateContestManagerMetadata(): Command<
  typeof schemas.CreateContestManagerMetadata
> {
  return {
    ...schemas.CreateContestManagerMetadata,
    auth: [isCommunityAdmin],
    body: async ({ id, payload }) => {
      const { topic_ids, ...rest } = payload;

      let contestTopics: TopicAttributes[] = [];
      let contestTopicsToCreate: z.infer<typeof schemas.ContestTopic>[] = [];

      if (topic_ids) {
        // verify topics exist
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
        contestTopics = topics.map((t) => t.get({ plain: true }));
        contestTopicsToCreate = topics.map((t) => ({
          contest_address: rest.contest_address,
          topic_id: t.id!,
          created_at: new Date(),
        }));
      }

      const contestManager = await models.sequelize.transaction(
        async (transaction) => {
          const manager = await models.ContestManager.create(
            {
              ...rest,
              community_id: id!,
              created_at: new Date(),
              cancelled: false,
            },
            { transaction },
          );

          await models.ContestTopic.bulkCreate(contestTopicsToCreate, {
            transaction,
          });

          return manager;
        },
      );

      if (mustExist('Contest Manager', contestManager)) {
        return {
          contest_managers: [
            {
              ...contestManager.get({ plain: true }),
              topics: contestTopics as Required<TopicAttributes>[],
            },
          ],
        };
      }
    },
  };
}
