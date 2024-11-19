import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import z from 'zod';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { getLaunchpadTradeTransaction } from '../services/commonProtocol/launchpadHelpers';

const launchpadEthChainIds = Object.values(
  commonProtocol.factoryContracts,
).reduce<number[]>((acc, contract) => {
  if (contract.launchpad) {
    acc.push(contract.chainId);
  }
  return acc;
}, []);

export function CreateLaunchpadTrade(): Command<
  typeof schemas.CreateLaunchpadTrade
> {
  return {
    ...schemas.CreateLaunchpadTrade,
    auth: [],
    body: async ({ payload }) => {
      const { eth_chain_id, transaction_hash } = payload;
      if (!launchpadEthChainIds.includes(eth_chain_id)) {
        throw Error(
          `EVM Chain ${eth_chain_id} does not have deployed launchpad`,
        );
      }

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

      const result = await getLaunchpadTradeTransaction({
        rpc: chainNode.private_url! || chainNode.url!,
        transactionHash: transaction_hash,
      });
      if (!result) {
        throw new InvalidState('Transaction not found');
      }

      const trade = await models.LaunchpadTrade.create({
        eth_chain_id,
        transaction_hash,
        token_address: result.parsedArgs.tokenAddress.toLowerCase(),
        trader_address: result.parsedArgs.traderAddress,
        is_buy: result.parsedArgs.isBuy,
        community_token_amount: result.parsedArgs.communityTokenAmount,
        price:
          Number(
            (result.parsedArgs.ethAmount * BigInt(1e18)) /
              result.parsedArgs.communityTokenAmount,
          ) / 1e18,
        floating_supply: result.parsedArgs.floatingSupply,
        timestamp: Number(result.block.timestamp),
      });

      return trade.get({ plain: true }) as unknown as z.infer<
        typeof schemas.LaunchpadTradeView
      >;
    },
  };
}
