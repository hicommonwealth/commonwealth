import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ForumActionsEnum } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../database';
import { isCommunityAdminOrModerator } from '../middleware';
import { mustNotExist } from '../middleware/guards';
import { GroupAttributes, GroupPermissionAttributes } from '../models';

export const MAX_GROUPS_PER_COMMUNITY = 20;
export const Errors = {
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export function CreateGroup(): Command<typeof schemas.CreateGroup> {
  return {
    ...schemas.CreateGroup,
    auth: [isCommunityAdminOrModerator],
    body: async ({ payload }) => {
      const groups = await models.Group.findAll({
        where: { community_id: payload.id },
        attributes: ['metadata'],
        raw: true,
      });

      mustNotExist(
        'Group',
        groups.find((g) => g.metadata.name === payload.metadata.name),
      );

      if (groups.length >= MAX_GROUPS_PER_COMMUNITY)
        throw new InvalidState(Errors.MaxGroups);

      const topicsToAssociate = await models.Topic.findAll({
        where: {
          id: {
            [Op.in]: payload.topics || [],
          },
          community_id: payload.id,
        },
      });
      if (payload.topics?.length !== topicsToAssociate.length)
        throw new InvalidState(Errors.InvalidTopics);

      const newGroup = await models.sequelize.transaction(
        async (transaction) => {
          // create group
          const group = await models.Group.create(
            {
              community_id: payload.id,
              metadata: payload.metadata,
              requirements: payload.requirements,
              is_system_managed: false,
            } as GroupAttributes,
            { transaction },
          );
          if (topicsToAssociate.length > 0) {
            const permissions = topicsToAssociate.map((topic) => ({
              group_id: group.id,
              topic_id: topic.id,
              allowed_actions: models.sequelize.literal(
                `ARRAY[${Object.values(ForumActionsEnum)
                  .map((value) => `'${value}'`)
                  .join(', ')}]::"enum_GroupPermissions_allowed_actions"[]`,
              ),
            }));

            await models.GroupPermission.bulkCreate(
              permissions as unknown as GroupPermissionAttributes[],
              {
                transaction,
              },
            );
          }
          return group.toJSON();
        },
      );

      // TODO: create domain service to refresh community memberships
      // TODO: create integration policy to connect creation events (like groups) to service above
      // TODO: creation integration test that validates this refresh flow
      //.refreshCommunityMemberships({
      //    communityId: id,
      //    groupId: newGroup.id,
      //  })

      return { id: payload.id, groups: [newGroup] };
    },
  };
}
