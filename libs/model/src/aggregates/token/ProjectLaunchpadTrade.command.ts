import { Command } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { chainNodeMustExist } from '../../policies/utils/utils';
import { handleCapReached } from './utils'; // TODO: place in utils

const schema = {
  input: events.LaunchpadTokenTraded,
  output: z.object({
    community_id: z.string().optional(),
  }),
};

export function ProjectLaunchpadTrade(): Command<typeof schema> {
  return {
    ...schema,
    auth: [],
    body: async ({ payload }) => {
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

      const output: z.infer<(typeof schema)['output']> = {};

      const token_address = token_address_unformatted.toLowerCase();
      const chainNode = await chainNodeMustExist(eth_chain_id);

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
        const token = await models.LaunchpadToken.findOne({
          where: { token_address },
          attributes: ['namespace'],
        });
        if (token) {
          const community = await models.Community.findOne({
            where: { namespace: token.namespace },
            attributes: ['id'],
          });
          if (community) {
            output.community_id = community.id;
            // find user_id from address
            const address = await models.Address.findOne({
              where: {
                address: trader_address,
                user_id: { [Op.not]: null },
              },
              attributes: ['user_id'],
            });
            if (address) {
              await models.Address.findOrCreate({
                where: {
                  community_id: community.id,
                  address: trader_address,
                  user_id: address.user_id,
                },
                defaults: {
                  community_id: community.id,
                  address: trader_address,
                  user_id: address.user_id,
                  role: 'member',
                  ghost_address: false,
                  is_banned: false,
                  verification_token: address.verification_token,
                },
                transaction,
              });
            }
          }
        }
      });

      // If cap reached, transfer to uniswap
      // TODO: what happens if something goes wrong here? Should this be a policy with a retry?
      await handleCapReached(
        token_address,
        floating_supply,
        trader_address,
        eth_chain_id,
        chainNode.private_url!,
        is_buy,
      );

      return output;
    },
  };
}
