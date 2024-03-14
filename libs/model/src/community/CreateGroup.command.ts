import { InvalidState, schemas, type Command } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { models, sequelize } from '../database';
import { isCommunityAdminOrModerator } from '../middleware';
import { mustNotExist } from '../middleware/guards';
import { GroupAttributes } from '../models';

export const MAX_GROUPS_PER_COMMUNITY = 20;
export const Errors = {
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export const CreateGroup: Command<
  typeof schemas.commands.CreateGroup
> = () => ({
  ...schemas.commands.CreateGroup,
  auth: [isCommunityAdminOrModerator],
  body: async ({ id, payload }) => {
    const groups = await models.Group.findAll({
      where: { community_id: id },
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
        community_id: id,
      },
    });
    if (payload.topics?.length !== topicsToAssociate.length)
      throw new InvalidState(Errors.InvalidTopics);

    const newGroup = await models.sequelize.transaction(async (transaction) => {
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
    });

    // TODO: create domain service to refresh community memberships
    // TODO: create integration policy to connect creation events (like groups) to service above
    // TODO: creation integration test that validates this refresh flow
    //.refreshCommunityMemberships({
    //    communityId: id,
    //    groupId: newGroup.id,
    //  })

    return { id, groups: [newGroup] };
  },
});
