import { bumpUserTierInPlace, UserTierMap } from '@hicommonwealth/shared';
import { Transaction } from 'sequelize';
import { models } from '../database';
import { getUserByAddress } from './getUserByAddress';

export async function bumpToChainVerified(
  userAddress: string,
  transaction: Transaction,
) {
  const user = await getUserByAddress(userAddress, {
    transaction,
    forUpdate: true,
  });
  if (user && user.tier < UserTierMap.ChainVerified) {
    const oldTier = user.tier;
    bumpUserTierInPlace({
      oldTier,
      newTier: UserTierMap.ChainVerified,
      targetObject: user,
    });
    if (user.tier !== oldTier) {
      await models.User.update(
        {
          tier: user.tier,
        },
        {
          where: {
            id: user.user_id,
          },
          transaction,
        },
      );
    }
  }
}
