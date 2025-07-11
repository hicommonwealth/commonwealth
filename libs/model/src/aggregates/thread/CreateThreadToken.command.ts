import { type Command } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function CreateToken(): Command<typeof schemas.CreateThreadToken> {
  return {
    ...schemas.CreateThreadToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, eth_chain_id, transaction_hash } = payload;

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['url', 'private_url'],
      });
      mustExist('ChainNode', chainNode);

      const {
        name,
        symbol,
        token_address,
        creator_address,
        created_at,
        total_supply,
        launchpad_liquidity,
        curve_id,
        reserve_ration,
        initial_purchase_eth_amount,
      } = await protocols.getLaunchpadTokenDetails({
        rpc: chainNode.private_url! || chainNode.url!,
        transactionHash: transaction_hash,
      });

      return models.sequelize.transaction(async (transaction) => {
        const [token, created] = await models.ThreadToken.findOrCreate({
          where: { token_address: token_address.toLowerCase() },
          defaults: {
            token_address: token_address.toLowerCase(),
            name,
            symbol,
            initial_supply: Number(BigInt(total_supply) / BigInt(1e18)),
            liquidity_transferred: false,
            launchpad_liquidity: BigInt(launchpad_liquidity).toString(),
            eth_market_cap_target: protocols.getTargetMarketCap(),
            creator_address,
          },
          transaction,
        });

        return {
          ...token!.toJSON(),
          community_id,
        } as unknown as z.infer<(typeof schemas.CreateThreadToken)['output']>;
      });
    },
  };
}
