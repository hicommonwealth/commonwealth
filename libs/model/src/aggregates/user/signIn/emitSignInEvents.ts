import { logger } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { models } from '../../../database';
import { AddressAttributes } from '../../../models/address';
import { UserAttributes } from '../../../models/user';
import { tokenBalanceCache } from '../../../services';
import { emitEvent } from '../../../utils/utils';

const log = logger(import.meta);

export async function emitSignInEvents({
  newAddress,
  newUser,
  transferredUser,
  address: addressInstance,
  user,
  transaction,
  originalUserId,
  ethChainId,
}: {
  newAddress: boolean;
  newUser: boolean;
  transferredUser: boolean;
  address: AddressAttributes;
  user: UserAttributes;
  transaction: Transaction;
  originalUserId?: number;
  ethChainId?: number;
}) {
  const {
    community_id,
    address: address,
    created_at,
    wallet_id,
  } = addressInstance;
  const { referred_by_address: referrer_address } = user;
  const events = [] as Array<schemas.EventPairs>;

  if (newAddress) {
    events.push({
      event_name: 'CommunityJoined',
      event_payload: {
        community_id,
        user_id: user.id!,
        referrer_address,
        created_at: created_at!,
      },
    });

    // check if this is a new wallet
    const existingWallet = await models.Address.findOne({
      where: { user_id: user.id, wallet_id, address: { [Op.ne]: address } },
    });
    if (!existingWallet) {
      // getBalances try-catch logs and returns empty balances on failures
      const balances = ethChainId
        ? await tokenBalanceCache.getBalances({
            addresses: [address],
            balanceSourceType: BalanceSourceType.ETHNative,
            sourceOptions: { evmChainId: ethChainId },
          })
        : { [address]: '0' };

      events.push({
        event_name: 'WalletLinked',
        event_payload: {
          user_id: user.id!,
          new_user: newUser,
          wallet_id: wallet_id!,
          balance: balances[address] || '0',
          community_id,
          created_at: created_at!,
        },
      });
    }

    // check if this is a new SSO provider
    if (addressInstance.oauth_provider) {
      const existingSso = await models.Address.findOne({
        where: {
          user_id: user.id,
          oauth_provider: addressInstance.oauth_provider,
          address: { [Op.ne]: address },
        },
      });
      if (!existingSso) {
        events.push({
          event_name: 'SSOLinked',
          event_payload: {
            user_id: user.id!,
            new_user: newUser,
            oauth_provider: addressInstance.oauth_provider,
            community_id,
            created_at: created_at!,
          },
        });
      }
    }
  }

  if (newUser)
    events.push({
      event_name: 'UserCreated',
      event_payload: {
        community_id,
        address,
        user_id: user.id!,
        created_at: created_at!,
        referrer_address,
      },
    });

  if (transferredUser && originalUserId) {
    const originalOwner = await models.User.findByPk(originalUserId);
    events.push({
      event_name: 'AddressOwnershipTransferred',
      event_payload: {
        community_id,
        address,
        user_id: user.id!,
        old_user_id: originalUserId,
        old_user_email: originalOwner?.email,
        created_at: new Date(),
      },
    });
  }

  log.trace(
    `Emitting Sign In Events: ${events.map((e) => e.event_name).join(',')}`,
  );
  await emitEvent(models.Outbox, events, transaction);
}
