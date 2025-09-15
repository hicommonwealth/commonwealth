import { getEvmAddress } from '@hicommonwealth/evm-protocols';
import { UserTierLevels, UserTierMap } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { models } from '../database';

export async function getUserByAddress(
  address: string,
  options?: {
    transaction: Transaction;
    forUpdate: boolean;
  },
): Promise<{ user_id: number; tier: UserTierLevels } | undefined> {
  const addr = await models.Address.findOne({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { address: address.toLowerCase() },
            { address: getEvmAddress(address) },
          ],
        },
        { user_id: { [Op.not]: null } },
        { is_banned: { [Op.eq]: false } },
      ],
    },
    attributes: ['user_id'],
    include: [
      {
        model: models.User,
        attributes: ['id', 'tier'],
        required: true,
        // don't reward unverified or banned users
        where: { tier: { [Op.gt]: UserTierMap.BannedUser } },
      },
    ],
    ...(options?.transaction
      ? {
          transaction: options.transaction,
        }
      : {}),
    ...(options?.forUpdate
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { lock: { level: 'NO KEY UPDATE' as any, of: models.User } }
      : {}),
  });

  return addr && addr.user_id
    ? { user_id: addr.user_id, tier: addr.User!.tier }
    : undefined;
}
