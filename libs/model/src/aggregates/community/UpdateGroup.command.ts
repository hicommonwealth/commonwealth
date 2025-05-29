import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { GroupAttributes } from '../../models';

export const UpdateGroupErrors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidTopics: 'Invalid topics',
  SystemManaged: 'Cannot update group that is system-managed',
};

export function UpdateGroup(): Command<typeof schemas.UpdateGroup> {
  return {
    ...schemas.UpdateGroup,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, group_id, metadata, requirements } = payload;

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
          // update topic level interaction permissions for current group
          await Promise.all(
            (payload.topics || [])?.map(async (t) => {
              const permissions = t.permissions;
              if (group.id) {
                const gatedActions = `ARRAY[${permissions
                  .map((p) => `'${p}'`)
                  .join(', ')}]::"enum_GroupGatedActions_gated_actions"[]`;
                await models.sequelize.query(
                  `
                  INSERT INTO "GroupGatedActions" (
                    group_id, topic_id, is_private,gated_actions, created_at, updated_at
                  )
                  VALUES (
                    :group_id, :topic_id, :is_private, ${gatedActions}, NOW(), NOW()
                  )
                  ON CONFLICT(group_id, topic_id) DO UPDATE
                    SET gated_actions = EXCLUDED.gated_actions,
                        is_private = EXCLUDED.is_private,
                        updated_at = NOW();
                `,
                  {
                    transaction,
                    replacements: {
                      group_id,
                      topic_id: t.id,
                      is_private: !!t.is_private,
                    },
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
