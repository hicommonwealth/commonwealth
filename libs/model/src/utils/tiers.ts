import { logger } from '@hicommonwealth/core';
import { isEvmAddress } from '@hicommonwealth/evm-protocols';
import { UserTierMap, WalletId } from '@hicommonwealth/shared';
import { QueryTypes, Transaction } from 'sequelize';
import { models } from '../database';

const log = logger(import.meta);

async function userHasChainTxn(userId: number, transaction: Transaction) {
  const txns = await models.sequelize.query<{ id: 1 }>(
    `
      WITH txns AS (SELECT A.id, LT.created_at as txn_at
      FROM "Addresses" A
              JOIN "LaunchpadTokens" LT ON LOWER(LT.creator_address) = LOWER(A.address)
      WHERE A.user_id = :userId
        AND LT.creator_address IS NOT NULL
      UNION ALL
      -- Users who have traded tokens
      SELECT A.id, to_timestamp(LT.timestamp) as txn_at
      FROM "Addresses" A
      JOIN "LaunchpadTrades" LT ON LOWER(LT.trader_address) = LOWER(A.address)
      WHERE A.user_id = :userId
      UNION ALL
      -- Users who have traded stake
      SELECT A.id, to_timestamp(ST.timestamp) as txn_at
      FROM "Addresses" A
      JOIN "StakeTransactions" ST ON LOWER(ST.address) = LOWER(A.address)
      WHERE A.user_id = :userId
      UNION ALL
      -- Users who have created contest managers
      SELECT A.id, CM.created_at as txn_at
      FROM "Addresses" A
      JOIN "ContestManagers" CM ON LOWER(CM.creator_address) = LOWER(A.address)
      WHERE A.user_id = :userId
      UNION ALL
      -- Users who have created a namespace
      SELECT A.id, C.created_at as txn_at
      FROM "Addresses" A
      JOIN "Communities" C ON LOWER(C.namespace_creator_address) = LOWER(A.address)
      WHERE A.user_id = :userId
      )
      SELECT 1 FROM txns LIMIT 1;
    `,
    {
      transaction,
      replacements: { userId },
      type: QueryTypes.SELECT,
      logging: console.log,
    },
  );
  return txns.length > 0;
}

type UserByAddress = {
  id?: number;
  wallet_id?: WalletId;
  user_id: number;
  tier: UserTierMap;
  user_created_at: Date;
  address_type: 'magic' | 'active';
};

async function getUserByAddress({
  address,
  userId,
  transaction,
}: {
  address?: string;
  transaction: Transaction;
  userId?: number;
}) {
  if (!address && !userId) return [];

  const res = await models.sequelize.query<UserByAddress>(
    `
    WITH target_user AS (
      SELECT U.id as user_id, U.tier, U.created_at
      FROM "Users" U
      ${
        userId
          ? 'WHERE U.id = :userId'
          : `JOIN "Addresses" A ON A.user_id = U.id` +
            ` WHERE address = :address OR LOWER(address) = :address AND A.user_id IS NOT NULL AND is_banned = false` +
            ` ${isEvmAddress(address!) ? 'OR address = :address' : ''}`
      }
      FOR NO KEY UPDATE OF U
      LIMIT 1
    ),
    magic_address AS (
      SELECT a.id, a.wallet_id, tu.user_id, tu.tier, tu.created_at as user_created_at, 'magic' AS address_type
      FROM "Addresses" a
      LEFT JOIN target_user tu ON a.user_id = tu.user_id
      WHERE a.wallet_id = 'magic'
      LIMIT 1
    ),
    active_address AS (
      SELECT a.id, a.wallet_id, tu.user_id, tu.tier, tu.created_at as user_created_at, 'active' AS address_type
      FROM "Addresses" a
      LEFT JOIN target_user tu ON a.user_id = tu.user_id
      WHERE a.last_active >= (tu.created_at + INTERVAL '1 week')
      LIMIT 1
    )
    SELECT * FROM magic_address
    UNION ALL
    SELECT * FROM active_address;
  `,
    {
      transaction,
      replacements: { address, userId },
      type: QueryTypes.SELECT,
      logging: console.log,
    },
  );
  return res;
}

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
  let tierToUpdate = newTier;
  console.time('GetUserQuery');
  const user = await getUserByAddress({
    address: userAddress,
    transaction,
    userId,
  });
  console.timeEnd('GetUserQuery');

  if (user.length === 0) {
    log.debug(`User with address ${userAddress} is not found`);
    return;
  }

  const magicAddress = user.find(
    (u) => u.address_type === 'magic',
  ) as UserByAddress;
  const activeAddress = user.find(
    (u) => u.address_type === 'active',
  ) as UserByAddress;
  const tier = magicAddress!.tier;

  if (tier === UserTierMap.BannedUser) {
    log.debug(`User with address ${userAddress} is banned`);
    return;
  }

  console.time('FullTierVerification');
  if (newTier === UserTierMap.ChainVerified) {
    if (tier === UserTierMap.SocialVerified && activeAddress.id) {
      tierToUpdate = UserTierMap.FullyVerified;
    } else if (tier === UserTierMap.VerifiedWallet && magicAddress.id) {
      tierToUpdate = UserTierMap.FullyVerified;
    }
  } else if (newTier === UserTierMap.SocialVerified) {
    if (tier === UserTierMap.ChainVerified && activeAddress.id) {
      tierToUpdate = UserTierMap.FullyVerified;
    } else if (tier === UserTierMap.VerifiedWallet) {
      const hasChainTxn = await userHasChainTxn(
        activeAddress.user_id,
        transaction,
      );
      if (hasChainTxn) {
        tierToUpdate = UserTierMap.FullyVerified;
      }
    }
  } else if (newTier === UserTierMap.VerifiedWallet) {
    if (tier === UserTierMap.ChainVerified && magicAddress.id) {
      tierToUpdate = UserTierMap.FullyVerified;
    } else if (tier === UserTierMap.SocialVerified) {
      const hasChainTxn = await userHasChainTxn(
        magicAddress.user_id,
        transaction,
      );
      if (hasChainTxn) {
        tierToUpdate = UserTierMap.FullyVerified;
      }
    }
  }
  console.timeEnd('FullTierVerification');

  if (tierToUpdate < tier) {
    log.debug(`User with address ${userAddress} is already at a higher tier`, {
      existingTier: tier,
      newTier: tierToUpdate,
    });
    return;
  }

  await models.User.update(
    {
      tier: tierToUpdate,
    },
    {
      where: { id: magicAddress.user_id },
      transaction,
    },
  );
}
