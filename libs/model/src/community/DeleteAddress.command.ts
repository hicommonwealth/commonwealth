import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

export const DeleteAddressErrors = {
  CannotDeleteMagic: 'Cannot delete Magic Link address',
  CannotDeleteOnlyAdmin:
    'Community must have at least 1 admin. Please assign another community member as admin, to leave this community.',
};

export function DeleteAddress(): Command<typeof schemas.DeleteAddress> {
  return {
    ...schemas.DeleteAddress,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id, address } = payload;

      const addr = await models.Address.findOne({
        where: { community_id, address, user_id: actor.user.id },
      });
      mustExist('Address', addr);
      if (addr.wallet_id === WalletId.Magic)
        throw new InvalidInput(DeleteAddressErrors.CannotDeleteMagic);

      const admins = await models.Address.findAll({
        where: { community_id, role: 'admin', user_id: { [Op.ne]: null } },
      });
      if (admins.length === 1 && admins[0].address === addr.address)
        throw new InvalidInput(DeleteAddressErrors.CannotDeleteOnlyAdmin);

      // TODO: why soft delete?
      await models.Address.update(
        { user_id: null, verified: null },
        { where: { id: addr.id } },
      );

      return { community_id, address };
    },
  };
}
