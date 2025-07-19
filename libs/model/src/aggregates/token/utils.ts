import {
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  factoryContracts,
  getLaunchpadToken,
  mustBeProtocolChainId,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import {
  getPostTokenFunded,
  transferPostLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols/src/common-protocol';
import { QueryTypes } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware';
import { emitEvent } from '../../utils';

const log = logger(import.meta);

export async function handleCapReached(
  token_address: string,
  floating_supply: bigint,
  trader_address: string,
  eth_chain_id: number,
  url: string,
  is_buy: boolean,
  isThreadToken = false,
) {
  const provider = notificationsProvider();

  mustBeProtocolChainId(eth_chain_id);

  const TokenModel = isThreadToken ? models.ThreadToken : models.LaunchpadToken;

  const token = await TokenModel.findOne({
    where: { token_address },
  });
  if (!token) throw new Error('Token not found');

  const tokenHolders = await models.sequelize.query<{
    user_id: number;
    community_id: string;
    symbol: string;
  }>(
    `
        SELECT DISTINCT
        ON (A.user_id) A.user_id, C.id as community_id, T.symbol
        FROM "Addresses" A
            JOIN "Communities" C
        ON C.id = A.community_id
            JOIN "${isThreadToken ? 'ThreadTokens' : 'LaunchpadTokens'}" T ON T.namespace = C.namespace
        WHERE :token_address = T.token_address AND A.address != :trader_address;
    `,
    {
      replacements: { token_address, trader_address },
      type: QueryTypes.SELECT,
    },
  );

  const notifyUsers = tokenHolders.map((u) => ({ id: String(u.user_id) }));

  if (notifyUsers.length > 0) {
    await provider.triggerWorkflow({
      key: isThreadToken
        ? WorkflowKeys.ThreadTokenTradeEvent
        : WorkflowKeys.LaunchpadTradeEvent,
      users: notifyUsers,
      data: {
        community_id: tokenHolders[0].community_id,
        symbol: tokenHolders[0].symbol,
        is_buy,
      },
    });
  }

  const transferLiquidityThreshold = BigInt(1000);
  const remainingLiquidity =
    BigInt(token.launchpad_liquidity) - floating_supply;

  const contracts = factoryContracts[eth_chain_id];
  if (
    !token.liquidity_transferred &&
    remainingLiquidity < transferLiquidityThreshold
  ) {
    let funded: boolean;
    if (isThreadToken) {
      const threadTokenBondingCurveAddress = (
        contracts as { tokenBondingCurve: string }
      ).tokenBondingCurve;

      if (!threadTokenBondingCurveAddress) {
        throw new Error('Thread token bondingCurveAddress not found');
      }
      funded = await getPostTokenFunded({
        rpc: url,
        tokenAddress: token_address,
        threadTokenBondingCurveAddress,
      });

      mustExist(
        'env LAUNCHPAD_PRIVATE_KEY',
        !!config.WEB3.LAUNCHPAD_PRIVATE_KEY,
      );

      await transferPostLiquidityToUniswap({
        rpc: url,
        tokenAddress: token_address,
        threadTokenBondingCurveAddress,
        privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY!,
      });
    } else {
      const lpBondingCurveAddress = (contracts as { lpBondingCurve: string })
        .lpBondingCurve;

      if (!lpBondingCurveAddress) {
        throw new Error('Token bondingCurveAddress not found');
      }
      funded = (
        await getLaunchpadToken({
          rpc: url,
          tokenAddress: token_address,
          lpBondingCurveAddress,
        })
      ).funded;

      mustExist(
        'env LAUNCHPAD_PRIVATE_KEY',
        !!config.WEB3.LAUNCHPAD_PRIVATE_KEY,
      );

      await transferLaunchpadLiquidityToUniswap({
        rpc: url,
        tokenAddress: token_address,
        lpBondingCurveAddress,
        privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY!,
      });
    }

    if (!funded) {
      token.liquidity_transferred = true;
      log.debug(`Liquidity transferred to ${token_address}`);

      if (notifyUsers.length > 0) {
        await provider.triggerWorkflow({
          key: isThreadToken
            ? WorkflowKeys.ThreadTokenCapReached
            : WorkflowKeys.LaunchpadCapReached,
          users: notifyUsers,
          data: {
            symbol: tokenHolders[0].symbol,
            community_id: tokenHolders[0].community_id,
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
              event_name: isThreadToken
                ? 'ThreadTokenGraduated'
                : 'LaunchpadTokenGraduated',
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
