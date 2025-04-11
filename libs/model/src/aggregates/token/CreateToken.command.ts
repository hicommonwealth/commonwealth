import { InvalidState, type Command } from '@hicommonwealth/core';
import {
  commonProtocol,
  getErc20TokenInfo,
  getLaunchpadTokenCreatedTransaction,
} from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { TokenView } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import z from 'zod';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

export function CreateToken(): Command<typeof schemas.CreateToken> {
  return {
    ...schemas.CreateToken,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { chain_node_id, transaction_hash, description, icon_url } =
        payload;

      const chainNode = await models.ChainNode.findOne({
        where: { id: chain_node_id },
        attributes: ['eth_chain_id', 'url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const tokenData = await getLaunchpadTokenCreatedTransaction({
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

      const [token] = await models.LaunchpadToken.findOrCreate({
        where: {
          token_address: tokenData.parsedArgs.tokenAddress.toLowerCase(),
          namespace: tokenData.parsedArgs.namespace,
        },
        defaults: {
          token_address: tokenData.parsedArgs.tokenAddress.toLowerCase(),
          namespace: tokenData.parsedArgs.namespace,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          initial_supply: Number(tokenInfo.totalSupply / BigInt(1e18)),
          liquidity_transferred: false,
          launchpad_liquidity: tokenData.parsedArgs.launchpadLiquidity,
          eth_market_cap_target: commonProtocol.getTargetMarketCap(),
          description: description ?? null,
          icon_url: icon_url ?? null,
          creator_address: actor.address,
        },
      });

      const response = token!.toJSON() as unknown as z.infer<typeof TokenView>;

      const threadId = Number(tokenInfo.name);

      // generic token launch case
      if (!threadId) {
        return response;
      }

      // If token launch is a tokenized thread, link to thread
      await models.sequelize.query(
        `
        UPDATE "Threads"
        SET launchpad_token_address = :launchpadTokenAddress, is_linking_token = false
        WHERE id = :threadId AND is_linking_token = false;
      `,
        {
          replacements: {
            launchpadTokenAddress:
              tokenData.parsedArgs.tokenAddress.toLowerCase(),
            threadId: tokenInfo.name,
          },
          type: QueryTypes.SELECT,
        },
      );

      // tokenized thread linking done, return regular response
      return response;
    },
  };
}
