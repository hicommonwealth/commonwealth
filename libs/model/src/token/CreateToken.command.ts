import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { TokenView } from '@hicommonwealth/schemas';
import { commonProtocol } from '@hicommonwealth/shared';
import z from 'zod';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';
import {
  getErc20TokenInfo,
  getTokenCreatedTransaction,
} from '../services/commonProtocol/launchpadHelpers';

export function CreateToken(): Command<typeof schemas.CreateToken> {
  return {
    ...schemas.CreateToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { chain_node_id, transaction_hash, description, icon_url } =
        payload;

      const chainNode = await models.ChainNode.findOne({
        where: { id: chain_node_id },
        attributes: ['eth_chain_id', 'url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const tokenData = await getTokenCreatedTransaction({
        rpc: chainNode.private_url! || chainNode.url!,
        transactionHash: transaction_hash,
      });

      if (!tokenData) {
        throw new InvalidState('Transaction not found');
      }

      let tokenInfo: { name: string; symbol: string; totalSupply: bigint };
      try {
        tokenInfo = await getErc20TokenInfo({
          rpc: chainNode.private_url || chainNode.url,
          tokenAddress: tokenData.parsedArgs.tokenAddress,
        });
      } catch (e) {
        throw new Error(
          `Failed to get erc20 token properties for token ${tokenData.parsedArgs.tokenAddress}`,
        );
      }

      const token = await models.Token.create({
        token_address: tokenData.parsedArgs.tokenAddress.toLowerCase(),
        namespace: tokenData.parsedArgs.namespace,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        initial_supply: tokenInfo.totalSupply,
        liquidity_transferred: false,
        launchpad_liquidity: tokenData.parsedArgs.launchpadLiquidity,
        eth_market_cap_target: commonProtocol.getTargetMarketCap(),
        description: description ?? null,
        icon_url: icon_url ?? null,
      });

      return token!.toJSON() as unknown as z.infer<typeof TokenView>;
    },
  };
}
