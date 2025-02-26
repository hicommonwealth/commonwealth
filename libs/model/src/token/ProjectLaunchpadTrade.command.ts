import { Command, logger } from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getLaunchpadToken,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { z } from 'zod';
import { config } from '../config';
import { models } from '../database';
import { chainNodeMustExist } from '../policies/utils/utils'; // TODO: place in utils

const log = logger(import.meta);

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
        token_address,
        trader_address,
        is_buy,
        eth_chain_id,
        eth_amount,
        community_token_amount,
        floating_supply,
      } = payload;

      const token = await models.LaunchpadToken.findOne({
        where: { token_address },
      });
      if (!token) throw new Error('Token not found');

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

      const contracts = cp.factoryContracts[eth_chain_id as cp.ValidChains];
      let lpBondingCurveAddress: string;
      if (contracts && 'lpBondingCurve' in contracts) {
        lpBondingCurveAddress = contracts.lpBondingCurve;
      } else {
        log.error('No lpBondingCurve address found for chain', undefined, {
          eth_chain_id,
        });
        return;
      }

      if (
        !token.liquidity_transferred &&
        floating_supply === BigInt(token.launchpad_liquidity)
      ) {
        const onChainTokenData = await getLaunchpadToken({
          rpc: chainNode.private_url!,
          tokenAddress: token_address,
          lpBondingCurveAddress,
        });

        if (!onChainTokenData.funded) {
          await transferLaunchpadLiquidityToUniswap({
            rpc: chainNode.private_url!,
            tokenAddress: token_address,
            lpBondingCurveAddress,
            privateKey: config.WEB3.PRIVATE_KEY,
          });
        }

        token.liquidity_transferred = true;
        await token.save();
      }
    },
  };
}
