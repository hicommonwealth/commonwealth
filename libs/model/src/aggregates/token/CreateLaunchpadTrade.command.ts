import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { Command, InvalidState } from '@hicommonwealth/core';
import { getClient } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { parseEventLogs } from 'viem';
import z from 'zod';
import { models } from '../../database';

export function CreateLaunchpadTrade(): Command<
  typeof schemas.CreateLaunchpadTrade
> {
  return {
    ...schemas.CreateLaunchpadTrade,
    auth: [],
    body: async ({ payload }) => {
      const { eth_chain_id, transaction_hash } = payload;

      const existingTrade = await models.LaunchpadTrade.findOne({
        where: {
          eth_chain_id,
          transaction_hash,
        },
      });
      if (existingTrade) {
        return existingTrade?.get({ plain: true }) as unknown as z.infer<
          typeof schemas.LaunchpadTradeView
        >;
      }

      const client = await getClient(eth_chain_id);

      const receipt = await client.getTransactionReceipt({
        hash: transaction_hash as `0x${string}`,
      });

      if (!receipt) {
        throw new InvalidState('Transaction not found');
      }

      const parsedLogs = parseEventLogs({
        abi: LPBondingCurveAbi,
        eventName: 'Trade',
        logs: receipt.logs,
      });

      if (parsedLogs.length === 0) {
        throw new InvalidState('Data could not be processed from txReceipt');
      }

      const result = parsedLogs[0].args;

      const tx = await client.getTransaction({
        hash: transaction_hash as `0x${string}`,
      });
      const block = await client.getBlock({ blockNumber: tx.blockNumber });

      // This case happens when liquidity is bought out
      if (result.tokenAmount === BigInt(0)) {
        return;
      }

      const trade = await models.LaunchpadTrade.create({
        eth_chain_id,
        transaction_hash,
        token_address: result.tokenAddress.toLowerCase(),
        trader_address: result.trader.toLowerCase(),
        is_buy: result.isBuy,
        community_token_amount: result.tokenAmount,
        price: Number(result.ethAmount / result.tokenAmount),
        floating_supply: result.floatingSupply,
        timestamp: Number(block.timestamp),
      });

      return trade.get({ plain: true }) as unknown as z.infer<
        typeof schemas.LaunchpadTradeView
      >;
    },
  };
}
