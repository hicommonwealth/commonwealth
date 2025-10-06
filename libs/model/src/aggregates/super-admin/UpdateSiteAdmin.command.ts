import { type Command } from '@hicommonwealth/core';
import { getEvmAddress } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { isSuperAdmin, mustExist } from '../../middleware';

export function UpdateSiteAdmin(): Command<typeof schemas.UpdateSiteAdmin> {
  return {
    ...schemas.UpdateSiteAdmin,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const { address, is_admin } = payload;

      const found = await models.Address.findOne({
        where: {
          address: address.startsWith('0x') ? getEvmAddress(address) : address,
          user_id: { [Op.ne]: null },
        },
        attributes: ['user_id'],
      });
      mustExist('Address', found);

      const user = await models.User.findOne({
        where: { id: found.user_id! },
      });
      mustExist('User', user);

      user.isAdmin = is_admin;
      await user.save();

      return true;
    },
  };
}
