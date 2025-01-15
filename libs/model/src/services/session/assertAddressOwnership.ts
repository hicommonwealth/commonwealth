import { ServerError, logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { models } from '../../database';

const log = logger(import.meta);

export async function assertAddressOwnership(address: string) {
  const addressUsers = await models.Address.findAll({
    where: {
      address,
      verified: { [Op.ne]: null },
    },
  });
  const numUserIds = new Set(addressUsers.map((au) => au.user_id)).size;
  if (numUserIds !== 1) {
    log.error(`Address ${address} is not owned by a single user!`);
    if (process.env.NODE_ENV !== 'production') {
      throw new ServerError('Address failed assertion check');
    }
  }
}
