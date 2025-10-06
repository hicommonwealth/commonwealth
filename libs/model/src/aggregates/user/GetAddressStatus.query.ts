import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authVerified } from '../../middleware';

export function GetAddressStatus(): Query<typeof schemas.GetAddressStatus> {
  return {
    ...schemas.GetAddressStatus,
    auth: [authVerified()],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id, address } = payload;

      const found = await models.Address.findOne({
        where: { community_id, address, verified: { [Op.ne]: null } },
        attributes: ['user_id'],
      });
      return found
        ? {
            exists: true,
            belongs_to_user: found.user_id === actor.user.id,
          }
        : {
            exists: false,
            belongs_to_user: false,
          };
    },
  };
}
