import {
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  getFactoryContract,
  getLaunchpadToken,
  mustBeProtocolChainId,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
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
) {
  const provider = notificationsProvider();

  mustBeProtocolChainId(eth_chain_id);

  const token = await models.LaunchpadToken.findOne({
    where: { token_address },
  });
  if (!token) throw new Error('Token not found');

  const tokenHolders = await models.sequelize.query<{
    user_id: number;
    community_id: string;
    symbol: string;
  }>(
    `
      SELECT DISTINCT ON (A.user_id) A.user_id, C.id as community_id, T.symbol
      FROM "Addresses" A
      JOIN "Communities" C ON C.id = A.community_id
      JOIN "LaunchpadTokens" T ON T.namespace = C.namespace
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
      key: WorkflowKeys.LaunchpadTradeEvent,
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
      await transferLaunchpadLiquidityToUniswap({
        rpc: url,
        tokenAddress: token_address,
        lpBondingCurveAddress: getFactoryContract(eth_chain_id).LPBondingCurve,
        privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY!,
      });

      token.liquidity_transferred = true;
      log.debug(`Liquidity transferred to ${token_address}`);

      if (notifyUsers.length > 0) {
        await provider.triggerWorkflow({
          key: WorkflowKeys.LaunchpadCapReached,
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
              event_name: 'LaunchpadTokenGraduated',
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
