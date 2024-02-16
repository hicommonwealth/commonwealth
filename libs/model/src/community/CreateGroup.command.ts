import { CommandMetadata, InvalidState } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models, sequelize } from '../database';
import { isCommunityAdminOrModerator } from '../middleware';
import { CommunityAttributes, GroupAttributes } from '../models';
import { Requirement } from './Requirements.schema';

const schema = z.object({
  metadata: z.object({
    name: z.string(),
    description: z.string(),
    required_requirements: z.number().optional(),
    membership_ttl: z.number().optional(),
  }),
  requirements: z.array(Requirement),
  topics: z.array(z.number()).optional(),
});

export const MAX_GROUPS_PER_COMMUNITY = 20;
export const Errors = {
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
  GroupAlreadyExists: 'Group already exists',
};

export const CreateGroup: CommandMetadata<CommunityAttributes, typeof schema> =
  {
    schema,
    auth: [isCommunityAdminOrModerator], // TODO: create reusable middleware to authorize owner, admins, moderators
    body: async ({ id, payload }) => {
      const groups = await models.Group.findAll({
        where: {
          community_id: id,
        }, // TODO: just return the names
      });

      if (groups.find((g) => g.metadata.name === payload.metadata.name))
        throw new InvalidState(Errors.GroupAlreadyExists);

      if (groups.length >= MAX_GROUPS_PER_COMMUNITY)
        throw new InvalidState(Errors.MaxGroups);

      const topicsToAssociate = await models.Topic.findAll({
        where: {
          id: {
            [Op.in]: payload.topics || [],
          },
          community_id: id,
        },
      });
      if (payload.topics?.length !== topicsToAssociate.length)
        throw new InvalidState(Errors.InvalidTopics);

      const newGroup = await models.sequelize.transaction(
        async (transaction) => {
          // create group
          const group = await models.Group.create(
            {
              community_id: id!,
              metadata: payload.metadata,
              requirements: payload.requirements,
            } as GroupAttributes,
            { transaction },
          );
          if (topicsToAssociate.length > 0) {
            // add group to all specified topics
            await models.Topic.update(
              {
                group_ids: sequelize.fn(
                  'array_append',
                  sequelize.col('group_ids'),
                  group.id,
                ),
              },
              {
                where: {
                  id: {
                    [Op.in]: topicsToAssociate.map(({ id }) => id!),
                  },
                },
                transaction,
              },
            );
          }
          return group.toJSON();
        },
      );

      // TODO: refresh memberships async

      return { id, groups: [newGroup] };
    },
  };
