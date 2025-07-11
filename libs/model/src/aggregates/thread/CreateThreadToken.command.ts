import { TokenLaunchpadAbi } from '@commonxyz/common-protocol-abis';
import { type Command } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import { withRetries } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import {
  createPublicClient,
  decodeEventLog,
  getEventSelector,
  Hash,
  http,
} from 'viem';
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

      const rpc = chainNode.private_url! || chainNode.url!;
      const client = createPublicClient({
        transport: http(rpc),
      });

      const receipt = await withRetries(() =>
        client.getTransactionReceipt({
          hash: transaction_hash as Hash,
        }),
      );

      const NEW_TOKEN_CREATED_TOPIC0 = getEventSelector({
        type: 'event',
        name: 'NewTokenCreated',
        inputs: TokenLaunchpadAbi.find(
          (x) => x.type === 'event' && x.name === 'NewTokenCreated',
        )!.inputs,
      });

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: TokenLaunchpadAbi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'NewTokenCreated') {
            decodedLogs.push(decoded.args);
          }
        } catch {
          // skip logs that don't match any event in the ABI
        }
      }

      const decoded = decodeEventLog({
        abi: TokenLaunchpadAbi,
        data: log.data,
        topics: log.topics,
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
