import { ServerError, logger } from '@hicommonwealth/core';
import type { DB } from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

export default async function assertAddressOwnership(
  models: DB,
  address: string,
) {
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
