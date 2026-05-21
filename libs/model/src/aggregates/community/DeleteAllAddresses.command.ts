import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { WalletId } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export const DeleteAllAddressesErrors = {
  CannotDeleteMagic: 'Cannot delete Magic Link address',
  CannotDeleteOnlyAdmin:
    'Community must have at least 1 admin. Please assign another community member as admin, to leave this community.',
  CannotDeleteLastAddress:
    'Cannot delete last community. Please join another community before leaving this one.',
};

export function DeleteAllAddresses(): Command<
  typeof schemas.DeleteAllAddresses
> {
  return {
    ...schemas.DeleteAllAddresses,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { community_id, address } = payload;

      const otherAddresses = await models.Address.count({
        where: {
          user_id: actor.user.id,
          community_id: { [Op.ne]: community_id },
        },
      });
      if (otherAddresses === 0)
        throw new InvalidInput(
          DeleteAllAddressesErrors.CannotDeleteLastAddress,
        );

      const addr = await models.Address.findOne({
        where: { community_id, address, user_id: actor.user.id },
      });
      mustExist('Address', addr);

      if (addr.wallet_id === WalletId.Magic)
        throw new InvalidInput(DeleteAllAddressesErrors.CannotDeleteMagic);

      const [associated, admins] = await Promise.all([
        models.Address.findAll({
          where: { community_id, user_id: addr.user_id },
        }),
        models.Address.findAll({
          where: { community_id, role: 'admin' },
        }),
      ]);
      if (associated.some((a) => a.wallet_id === WalletId.Magic))
        throw new InvalidInput(DeleteAllAddressesErrors.CannotDeleteMagic);
      if (
        admins.length === 1 &&
        admins.some((u) => associated.some((a) => u.address === a.address))
      )
        throw new InvalidInput(DeleteAllAddressesErrors.CannotDeleteOnlyAdmin);

      let deleted = 0;
      const ids = associated
        .map((a) => a.id)
        .filter((id): id is number => id !== undefined);
      if (ids.length > 0)
        [deleted] = await models.Address.update(
          { user_id: null, verified: null },
          { where: { id: ids } },
        );

      return { community_id, address, deleted };
    },
  };
}
