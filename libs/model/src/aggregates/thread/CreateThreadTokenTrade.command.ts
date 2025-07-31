import { TokenBondingCurveAbi } from '@commonxyz/common-protocol-abis';
import {
  type Command,
  InvalidState,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  getFactoryContract,
  getLaunchpadToken,
  getPublicClient,
  mustBeProtocolChainId,
  transferPostLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { config, emitEvent } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { parseEventLogs } from 'viem';
import z from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function CreateThreadTokenTrade(): Command<
  typeof schemas.CreateLaunchpadTrade
> {
  return {
    ...schemas.CreateLaunchpadTrade,
    auth: [],
    body: async ({ payload }) => {
      const { eth_chain_id, transaction_hash } = payload;

      const existingTrade = await models.ThreadTokenTrade.findOne({
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
        abi: TokenBondingCurveAbi,
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
        result.trader,
        eth_chain_id,
        url,
        result.isBuy,
      );

      // This case happens when liquidity is bought out
      if (result.tokenAmount === BigInt(0)) {
        return;
      }

      const trade = await models.ThreadTokenTrade.create({
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

async function handleCapReached(
  token_address: string,
  floating_supply: bigint,
  trader_address: string,
  eth_chain_id: number,
  url: string,
  is_buy: boolean,
) {
  const provider = notificationsProvider();

  mustBeProtocolChainId(eth_chain_id);

  const token = await models.ThreadToken.findOne({
    where: { token_address },
  });
  if (!token) throw new Error('Token not found');

  const tokenHolders = await models.sequelize.query<{
    user_id: number;
    thread_id: number;
    community_id: string;
    symbol: string;
  }>(
    `
      SELECT DISTINCT ON (A.user_id) A.user_id, C.id as community_id, TT.symbol, T.id as thread_id
      FROM "Addresses" A
      JOIN "Communities" C ON C.id = A.community_id
      JOIN "Threads" T ON T.community_id = C.id
      JOIN "ThreadTokens" TT ON TT.thread_id = T.id
      WHERE :token_address = TT.token_address AND A.address != :trader_address;
    `,
    {
      replacements: { token_address, trader_address },
      type: QueryTypes.SELECT,
    },
  );

  const notifyUsers = tokenHolders.map((u) => ({ id: String(u.user_id) }));

  if (notifyUsers.length > 0) {
    await provider.triggerWorkflow({
      key: WorkflowKeys.ThreadTokenTradeEvent,
      users: notifyUsers,
      data: {
        community_id: tokenHolders[0].community_id,
        thread_id: tokenHolders[0].thread_id,
        symbol: tokenHolders[0].symbol,
        is_buy,
      },
    });
  }

  const transferLiquidityThreshold = BigInt(1000);
  const remainingLiquidity =
    BigInt(token.launchpad_liquidity) - floating_supply;
  if (
    !token.liquidity_transferred &&
    remainingLiquidity < transferLiquidityThreshold
  ) {
    const onChainTokenData = await getLaunchpadToken({
      rpc: url,
      tokenAddress: token_address,
      lpBondingCurveAddress: getFactoryContract(eth_chain_id).LPBondingCurve,
    });

    mustExist('env LAUNCHPAD_PRIVATE_KEY', !!config.WEB3.LAUNCHPAD_PRIVATE_KEY);

    if (!onChainTokenData.funded) {
      await transferPostLiquidityToUniswap({
        rpc: url,
        threadTokenBondingCurveAddress:
          getFactoryContract(eth_chain_id).TokenBondingCurve,
        tokenAddress: token_address,
        privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY!,
      });

      token.liquidity_transferred = true;

      if (notifyUsers.length > 0) {
        await provider.triggerWorkflow({
          key: WorkflowKeys.ThreadTokenCapReached,
          users: notifyUsers,
          data: {
            symbol: tokenHolders[0].symbol,
            community_id: tokenHolders[0].community_id,
            thread_id: tokenHolders[0].thread_id,
          },
        });
      }
    }

    await models.sequelize.transaction(async (transaction) => {
      if (token.liquidity_transferred) {
        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'ThreadTokenGraduated',
              event_payload: {
                token: token.toJSON(),
              },
            },
          ],
          transaction,
        );
      }
      await token.save({ transaction });
    });
  }
}
