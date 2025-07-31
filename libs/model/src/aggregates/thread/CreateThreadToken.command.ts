import {
  TokenBondingCurveAbi,
  TokenLaunchpadAbi,
} from '@commonxyz/common-protocol-abis';
import { type Command, InvalidState } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import { withRetries } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { createPublicClient, Hash, http, parseEventLogs } from 'viem';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';

export function CreateThreadToken(): Command<typeof schemas.CreateThreadToken> {
  return {
    ...schemas.CreateThreadToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { eth_chain_id, transaction_hash } = payload;

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

      const parsedLogs = parseEventLogs({
        abi: TokenBondingCurveAbi,
        eventName: 'TokenRegistered',
        logs: receipt.logs,
      });

      if (parsedLogs.length === 0) {
        throw new InvalidState(
          'TokenRegistered event could not be processed from txReceipt',
        );
      }

      const {
        token: tokenAddress,
        totalSupply,
        launchpadLiquidity,
      } = parsedLogs[0].args;

      const tokenCreatedParsedLogs = parseEventLogs({
        abi: TokenLaunchpadAbi,
        eventName: 'NewTokenCreated',
        logs: receipt.logs,
      });

      if (tokenCreatedParsedLogs.length === 0) {
        throw new InvalidState(
          'NewTokenCreated event could not be processed from txReceipt',
        );
      }

      const { name, symbol, threadId } = tokenCreatedParsedLogs[0].args;

      const block = await client.getBlock({ blockHash: receipt.blockHash });
      const date = new Date(Number(block.timestamp) * 1000);

      return await models.sequelize.transaction(async (transaction) => {
        const [token] = await models.ThreadToken.findOrCreate({
          where: { token_address: tokenAddress.toLowerCase() },
          defaults: {
            token_address: tokenAddress.toLowerCase(),
            namespace: '',
            name,
            symbol,
            initial_supply: Number(BigInt(totalSupply) / BigInt(1e18)),
            liquidity_transferred: false,
            launchpad_liquidity: BigInt(launchpadLiquidity).toString(),
            eth_market_cap_target: protocols.getTargetMarketCap(),
            creator_address: receipt.from,
            thread_id: threadId.toString(),
            created_at: date,
            updated_at: date,
          },
          transaction,
        });

        return token!.toJSON();
      });
    },
  };
}
