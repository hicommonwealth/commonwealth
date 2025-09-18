import { logger } from '@hicommonwealth/core';
import { isEvmAddress } from '@hicommonwealth/evm-protocols';
import { UserTierMap } from '@hicommonwealth/shared';
import { QueryTypes, Transaction } from 'sequelize';
import { models } from '../database';

const log = logger(import.meta);

export async function setUserTier({
  userAddress,
  newTier,
  transaction,
  userId,
}: (
  | {
      userAddress: string;
      userId?: number;
    }
  | {
      userAddress?: undefined;
      userId: number;
    }
) & {
  newTier: UserTierMap;
  transaction: Transaction;
}) {
  const [user] = await models.sequelize.query(
    `
    SELECT U.*
    FROM "Users" U ${
      userId
        ? 'WHERE U.id = :userId'
        : `JOIN "Addresses" A ON A.user_id = U.id` +
          ` WHERE address = :address OR LOWER(address) = :address AND A.user_id IS NOT NULL AND is_banned = false` +
          ` ${isEvmAddress(userAddress!) ? 'OR address = :address' : ''}`
    }
    FOR NO KEY UPDATE OF U
    LIMIT 1;
  `,
    {
      transaction,
      replacements: {
        address: userAddress,
        userId,
      },
      type: QueryTypes.SELECT,
      model: models.User,
    },
  );
  if (!user) {
    log.debug(`User with address ${userAddress} is not found`);
    return;
  }
  if (user.tier === UserTierMap.BannedUser) {
    log.debug(`User with address ${userAddress} is banned`);
    return;
  }

  // always keep the highest tier
  if (user.tier < newTier) user.tier = newTier;

  // Set the fully verified if possible + set verified columns
  if (newTier === UserTierMap.ChainVerified) {
    if (user.wallet_verified && user.social_verified) {
      user.tier = UserTierMap.FullyVerified;
    }
    user.chain_verified = true;
  } else if (newTier === UserTierMap.SocialVerified) {
    if (user.wallet_verified && user.chain_verified) {
      user.tier = UserTierMap.FullyVerified;
    }
    user.social_verified = true;
  } else if (newTier === UserTierMap.VerifiedWallet) {
    if (user.social_verified && user.chain_verified) {
      user.tier = UserTierMap.FullyVerified;
    }
    user.wallet_verified = true;
  }
  console.timeEnd('FullTierVerification');

  await user.save({ transaction });
}
