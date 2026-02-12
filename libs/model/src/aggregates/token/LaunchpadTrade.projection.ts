import { Projection } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../../database';
import { chainNodeMustExist } from '../../policies/utils/utils';
import { setUserTier } from '../../utils/tiers';
import { handleCapReached } from './utils';

const inputs = {
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
};

export function LaunchpadTradeProjection(): Projection<typeof inputs> {
  return {
    inputs,
    body: {
      LaunchpadTokenTraded: async ({ payload }) => {
        const {
          block_timestamp,
          transaction_hash,
          token_address: token_address_unformatted,
          trader_address,
          is_buy,
          eth_chain_id,
          eth_amount,
          community_token_amount,
          floating_supply,
        } = payload;

        const token_address = token_address_unformatted.toLowerCase();
        const chainNode = await chainNodeMustExist(eth_chain_id);

        const token = await models.LaunchpadToken.findOne({
          where: { token_address },
          attributes: ['namespace'],
        });
        if (!token) return; // ignore if token not found

        const community = await models.Community.findOne({
          where: { namespace: token.namespace },
          attributes: ['id'],
        });
        const user_addr = await models.Address.scope('withPrivateData').findOne(
          {
            where: {
              address: trader_address,
              user_id: { [Op.not]: null },
            },
            attributes: [
              'user_id',
              'role',
              'ghost_address',
              'is_banned',
              'verification_token',
            ],
          },
        );

        await models.sequelize.transaction(async (transaction) => {
          await models.LaunchpadTrade.findOrCreate({
            where: { eth_chain_id, transaction_hash },
            defaults: {
              eth_chain_id,
              transaction_hash,
              token_address,
              trader_address,
              is_buy,
              community_token_amount,
              price:
                Number((eth_amount * BigInt(1e18)) / community_token_amount) /
                1e18,
              floating_supply,
              timestamp: Number(block_timestamp),
            },
            transaction,
          });

          // auto-join community after trades
          if (community && user_addr) {
            await models.Address.findOrCreate({
              where: {
                community_id: community.id,
                address: trader_address,
              },
              defaults: {
                community_id: community.id,
                address: trader_address,
                user_id: user_addr.user_id,
                role: user_addr.role ?? 'member',
                ghost_address: user_addr.ghost_address ?? false,
                is_banned: user_addr.is_banned ?? false,
                verification_token: user_addr.verification_token,
              },
              transaction,
            });
          }

          await setUserTier({
            userAddress: trader_address,
            newTier: UserTierMap.ChainVerified,
            transaction,
          });
        });

        // If cap reached, transfer to uniswap
        await handleCapReached(
          token_address,
          floating_supply,
          trader_address,
          eth_chain_id,
          chainNode.private_url!,
          is_buy,
        );
      },
    },
  };
}
