import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { AuthContext, isAuthorized } from '../middleware';

export const BanAddressErrors = {
  NotFound: 'Address not found',
  AlreadyExists: 'Ban for this address already exists',
};

export function BanAddress(): Command<typeof schemas.BanAddress, AuthContext> {
  return {
    ...schemas.BanAddress,
    auth: [isAuthorized({ roles: ['admin'] })],
    body: async ({ payload }) => {
      const { community_id, address } = payload;
      const addressInstance = await models.Address.findOne({
        where: {
          community_id,
          address,
        },
      });
      if (!addressInstance) {
        throw new InvalidState(BanAddressErrors.NotFound);
      }
      if (addressInstance.is_banned) {
        throw new InvalidState(BanAddressErrors.AlreadyExists);
      }
      addressInstance.is_banned = true;
      await addressInstance.save();

      return {};
    },
  };
}
