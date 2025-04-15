import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { emitEvent } from '../../utils/utils';

export const UpdateRoleErrors = {
  MustHaveAdmin: 'Communities must have at least one admin',
};

export function UpdateRole(): Command<typeof schemas.UpdateRole> {
  return {
    ...schemas.UpdateRole,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { community_id, address, role } = payload;

      const addr = await models.Address.findOne({
        where: { community_id, address },
      });
      mustExist('Address', addr);

      if (role !== addr.role) {
        // if demoting from admin ensure at least 1 other admin remains
        if (addr.role === 'admin' && !actor.user.isAdmin) {
          const admins = await models.Address.findOne({
            where: {
              community_id,
              role: 'admin',
              id: { [Op.ne]: addr.id },
            },
          });
          if (!admins) throw new InvalidInput(UpdateRoleErrors.MustHaveAdmin);
        }

        await models.sequelize.transaction(async (transaction) => {
          addr.role = role;
          await addr.save({ transaction });

          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'RoleUpdated',
                event_payload: {
                  community_id,
                  address,
                  role,
                  created_at: new Date(),
                },
              },
            ],
            transaction,
          );
        });
      }

      return { community_id, address, role };
    },
  };
}
