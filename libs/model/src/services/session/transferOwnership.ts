import * as schemas from '@hicommonwealth/schemas';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';

/**
 * Transfers ownership of address to user in addr from other users with same address
 */
export async function transferOwnership(
  addr: z.infer<typeof schemas.Address>,
  transaction: Transaction,
) {
  const found = await models.Address.findOne({
    where: {
      address: addr.address,
      user_id: { [Op.ne]: addr.user_id },
      // verified: { [Op.ne]: null },
    },
    include: {
      model: models.User,
      required: true,
      attributes: ['id', 'email'],
    },
    transaction,
  });
  if (found) {
    const [updated] = await models.Address.update(
      { user_id: addr.user_id },
      {
        where: { address: addr.address, user_id: found?.user_id },
        transaction,
      },
    );
    if (updated > 0) return found?.User;
  }
}
