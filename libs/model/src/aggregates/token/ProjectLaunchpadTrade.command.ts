import { Command } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';
import { chainNodeMustExist } from '../../policies/utils/utils';
import { handleCapReached } from './utils'; // TODO: place in utils

const schema = {
  input: events.LaunchpadTokenTraded,
  output: z.object({}),
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

      const token_address = token_address_unformatted.toLowerCase();

      const chainNode = await chainNodeMustExist(eth_chain_id);

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
            Number((eth_amount * BigInt(1e18)) / community_token_amount) / 1e18,
          floating_supply,
          timestamp: Number(block_timestamp),
        },
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
  };
}
