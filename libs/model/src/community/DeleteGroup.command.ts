import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models, sequelize } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

export const DeleteGroupErrors = {
  SystemManaged: 'Cannot delete group that is system-managed',
};

export function DeleteGroup(): Command<typeof schemas.DeleteGroup> {
  return {
    ...schemas.DeleteGroup,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { community_id, group_id } = payload;

      const group = await models.Group.findOne({
        where: { community_id, id: group_id },
      });
      mustExist('Group', group);

      if (group.is_system_managed && !actor.user.isAdmin)
        throw new InvalidInput(DeleteGroupErrors.SystemManaged);

      await models.sequelize.transaction(async (transaction) => {
        await models.Topic.update(
          {
            group_ids: sequelize.fn(
              'array_remove',
              sequelize.col('group_ids'),
              group_id,
            ),
          },
          {
            where: { community_id, group_ids: { [Op.contains]: [group_id] } },
            transaction,
          },
        );
        await models.Membership.destroy({
          where: { group_id },
          transaction,
        });
        await models.Group.destroy({
          where: { id: group_id },
          transaction,
        });
      });

      return { community_id, group_id };
    },
  };
}
