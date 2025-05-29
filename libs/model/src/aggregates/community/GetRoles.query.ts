import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function GetRoles(): Query<typeof schemas.GetRoles> {
  return {
    ...schemas.GetRoles,
    auth: [authRoles()],
    secure: true,
    body: async ({ payload }) => {
      const { community_id, roles } = payload;
      const parsed = roles
        .split(',')
        .filter((r) => ['moderator', 'admin'].includes(r));

      const addresses = await models.Address.findAll({
        where: { community_id, role: { [Op.in]: parsed } },
        attributes: ['address', 'role'],
      });

      return addresses.map((a) => a.toJSON()) as z.infer<
        (typeof schemas.GetRoles)['output']
      >;
    },
  };
}
