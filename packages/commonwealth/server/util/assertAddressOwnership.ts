import type { DB } from '../models';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { ServerError } from 'common-common/src/errors';

const log = factory.getLogger(formatFilename(__filename));

export default async function assertAddressOwnership(
  models: DB,
  address: string
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

  const numProfileIds = new Set(addressUsers.map((au) => au.profile_id)).size;
  if (numProfileIds !== 1) {
    log.error(`Address ${address} relates to multiple profiles!`);
    if (process.env.NODE_ENV !== 'production') {
      throw new ServerError('Address failed assertion check');
    }
  }
}
