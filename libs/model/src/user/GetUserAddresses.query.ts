import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../database';

export function GetUserAddresses(): Query<typeof schemas.GetUserAddresses> {
  return {
    ...schemas.GetUserAddresses,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { communities, addresses } = payload;

      const _addresses = await models.Address.findAll({
        where: {
          ...(addresses.length > 0
            ? { address: { [Op.in]: addresses.split(',') } }
            : { user_id: actor.user.id }),
          ...(communities.length > 0
            ? { community_id: { [Op.in]: communities.split(',') } }
            : {}),
        },
        attributes: ['address', 'last_active'],
        include: [
          {
            model: models.User,
            attributes: ['id', 'profile', 'created_at'],
            required: true,
          },
        ],
      });

      return _addresses.map((address) => ({
        userId: address.User!.id!,
        name: address.User?.profile.name ?? DEFAULT_NAME,
        address: address.address,
        lastActive: address.last_active ?? address.User!.created_at!,
        avatarUrl: address.User?.profile.avatar_url,
      }));
    },
  };
}
