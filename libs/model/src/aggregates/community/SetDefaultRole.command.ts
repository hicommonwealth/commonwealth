import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function SetDefaultRole(): Command<typeof schemas.SetDefaultRole> {
  return {
    ...schemas.SetDefaultRole,
    auth: [authRoles()],
    secure: true,
    body: async ({ payload, context }) => {
      const { community_id } = payload;

      await models.sequelize.transaction(async (transaction) => {
        await models.Address.update(
          { is_user_default: true },
          { where: { id: context?.address.id }, transaction },
        );
        await models.Address.update(
          { is_user_default: false },
          {
            where: { community_id, id: { [Op.ne]: context?.address.id } },
            transaction,
          },
        );
      });
      return true;
    },
  };
}
