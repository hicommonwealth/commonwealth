import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models, sequelize } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { mustBeAuthorized, mustNotExist } from '../middleware/guards';
import { GroupAttributes } from '../models';

export const MAX_GROUPS_PER_COMMUNITY = 20;

export const CreateGroupErrors = {
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export function CreateGroup(): Command<
  typeof schemas.CreateGroup,
  AuthContext
> {
  return {
    ...schemas.CreateGroup,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ actor, payload, auth }) => {
      const { community_id } = mustBeAuthorized(actor, auth);

      const topics = await models.Topic.findAll({
        where: {
          id: { [Op.in]: payload.topics?.map((t) => t.id) || [] },
          community_id,
        },
      });
      if (payload.topics?.length !== topics.length)
        throw new InvalidInput(CreateGroupErrors.InvalidTopics);

      const groups = await models.Group.findAll({
        where: { community_id },
        attributes: ['metadata'],
        raw: true,
      });
      mustNotExist(
        'Group',
        groups.find((g) => g.metadata.name === payload.metadata.name),
      );
      if (groups.length >= MAX_GROUPS_PER_COMMUNITY)
        throw new InvalidInput(CreateGroupErrors.MaxGroups);

      const newGroup = await models.sequelize.transaction(
        async (transaction) => {
          const group = await models.Group.create(
            {
              community_id,
              metadata: payload.metadata,
              requirements: payload.requirements,
              is_system_managed: false,
            } as GroupAttributes,
            { transaction },
          );
          if (topics.length > 0) {
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
                where: { id: { [Op.in]: topics.map(({ id }) => id!) } },
                transaction,
              },
            );

            // add topic level interaction permissions for current group
            await Promise.all(
              (payload.topics || [])?.map(async (t) => {
                if (group.id) {
                  await models.GroupTopicPermission.create(
                    {
                      group_id: group.id,
                      topic_id: t.id,
                      allowed_actions: t.permission,
                    },
                    { transaction },
                  );
                }
              }),
            );
          }
          return group.toJSON();
        },
      );

      return { id: community_id, groups: [newGroup] };
    },
  };
}
