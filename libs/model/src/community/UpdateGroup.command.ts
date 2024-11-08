import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models, sequelize } from '../database';
import { authRoles } from '../middleware';
import { mustBeAuthorized, mustExist } from '../middleware/guards';
import { GroupAttributes } from '../models';

export const UpdateGroupErrors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidTopics: 'Invalid topics',
  SystemManaged: 'Cannot update group that is system-managed',
};

export function UpdateGroup(): Command<typeof schemas.UpdateGroup> {
  return {
    ...schemas.UpdateGroup,
    auth: [authRoles('admin')],
    body: async ({ actor, payload, auth }) => {
      const { community_id } = mustBeAuthorized(actor, auth);
      const { group_id, metadata, requirements } = payload;

      const group = await models.Group.findOne({
        where: { community_id, id: group_id },
      });
      mustExist('Group', group);

      if (group.is_system_managed)
        throw new InvalidInput(UpdateGroupErrors.SystemManaged);

      const topics = await models.Topic.findAll({
        where: {
          id: { [Op.in]: payload.topics?.map((t) => t.id) || [] },
          community_id,
        },
      });
      if (payload.topics?.length !== topics.length)
        throw new InvalidInput(UpdateGroupErrors.InvalidTopics);

      const updates: Partial<GroupAttributes> = {};
      metadata && (updates.metadata = metadata);
      requirements && (updates.requirements = requirements);

      return await models.sequelize.transaction(async (transaction) => {
        if (updates.requirements?.length) {
          await models.Membership.destroy({
            where: { group_id },
            transaction,
          });
        }

        await group.update(updates, { transaction });

        if (topics.length > 0) {
          const ids = topics.map(({ id }) => id!);
          await models.Topic.update(
            {
              group_ids: sequelize.fn(
                'array_append',
                sequelize.col('group_ids'),
                group_id,
              ),
            },
            {
              where: {
                id: { [Op.in]: ids },
                [Op.not]: { group_ids: { [Op.contains]: [group_id] } },
              },
              transaction,
            },
          );

          // remove group from existing group topics
          await models.Topic.update(
            {
              group_ids: sequelize.fn(
                'array_remove',
                sequelize.col('group_ids'),
                group_id,
              ),
            },
            {
              where: {
                id: { [Op.notIn]: ids },
                group_ids: { [Op.contains]: [group_id] },
              },
              transaction,
            },
          );

          // update topic level interaction permissions for current group
          await Promise.all(
            (payload.topics || [])?.map(async (t) => {
              if (group.id) {
                await models.GroupPermission.update(
                  {
                    allowed_actions: t.permissions,
                  },
                  {
                    where: {
                      group_id: group_id,
                      topic_id: t.id,
                    },
                    transaction,
                  },
                );
              }
            }),
          );
        }

        return group.toJSON();
      });
    },
  };
}
