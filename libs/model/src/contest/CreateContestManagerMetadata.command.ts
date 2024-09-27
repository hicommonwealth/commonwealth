import type { Command } from '@hicommonwealth/core';
import { InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import z from 'zod';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustExist } from '../middleware/guards';
import { TopicAttributes } from '../models';

const Errors = {
  InvalidTopics: 'Invalid topics',
  StakeNotEnabled: 'Stake must be enabled to create a recurring contest',
};

export function CreateContestManagerMetadata(): Command<
  typeof schemas.CreateContestManagerMetadata,
  AuthContext
> {
  return {
    ...schemas.CreateContestManagerMetadata,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { id, topic_ids, ...rest } = payload;

      // if stake is not enabled, only allow one-off contests
      const stake = await models.CommunityStake.findOne({
        where: {
          community_id: id,
        },
      });
      if (!stake && payload.interval > 0) {
        throw new InvalidState(Errors.StakeNotEnabled);
      }

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

      const farcaster_frame_url = `/api/farcaster/contests/${payload.contest_address}`;

      const contestManager = await models.sequelize.transaction(
        async (transaction) => {
          const manager = await models.ContestManager.create(
            {
              ...rest,
              community_id: id.toString(),
              created_at: new Date(),
              cancelled: false,
              farcaster_frame_url,
            },
            { transaction },
          );

          await models.ContestTopic.bulkCreate(contestTopicsToCreate, {
            transaction,
          });

          return manager;
        },
      );

      mustExist('Contest Manager', contestManager);
      return {
        contest_managers: [
          {
            ...contestManager.get({ plain: true }),
            topics: contestTopics as Required<TopicAttributes>[],
          },
        ],
      };
    },
  };
}
