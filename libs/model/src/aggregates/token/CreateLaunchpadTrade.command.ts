import { LPBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import { Command, InvalidState } from '@hicommonwealth/core';
import { getPublicClient } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { parseEventLogs } from 'viem';
import z from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware';
import { handleCapReached } from './utils';

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

      const chainNode = await models.ChainNode.scope('withPrivateData').findOne(
        {
          where: {
            eth_chain_id,
          },
        },
      );
      mustExist('Chain Node', chainNode);
      const url = chainNode.private_url! || chainNode.url!;
      const client = getPublicClient({
        eth_chain_id,
        rpc: url,
      });

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

      // If cap reached, transfer to uniswap
      await handleCapReached(
        result.tokenAddress.toLowerCase(),
        result.floatingSupply,
        eth_chain_id,
        url,
        result.isBuy,
      );

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
        price:
          Number((result.ethAmount * BigInt(1e18)) / result.tokenAmount) / 1e18,
        floating_supply: result.floatingSupply,
        timestamp: Number(block.timestamp),
      });

      return trade.get({ plain: true }) as unknown as z.infer<
        typeof schemas.LaunchpadTradeView
      >;
    },
  };
}
