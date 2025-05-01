import {
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getLaunchpadToken,
  mustBeProtocolChainId,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { config, models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { mustExist } from '../../middleware';

const log = logger(import.meta);

export async function handleCapReached(
  token_address: string,
  floating_supply: bigint,
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
      SELECT U.user_id, C.community_id, T.symbol from "Users" U
      JOIN "Addresses" A ON U.user_id = A.user_id
      JOIN "Communities" C ON C.id = A.community_id
      JOIN "Tokens" T ON T.namespace = C.namespace
      WHERE :token_address = T.token_address;
    `,
    {
      replacements: { token_address },
      type: QueryTypes.SELECT,
    },
  );

  await provider.triggerWorkflow({
    key: WorkflowKeys.TradeEvent,
    users: tokenHolders.map((u) => ({ id: String(u.user_id) })),
    data: {
      community_id: tokenHolders[0].community_id,
      symbol: tokenHolders[0].symbol,
      is_buy,
    },
  });

  const transferLiquidityThreshold = BigInt(1000);
  const remainingLiquidity =
    BigInt(token.launchpad_liquidity) - floating_supply;
  if (
    !token.liquidity_transferred &&
    remainingLiquidity < transferLiquidityThreshold
  ) {
    const contracts = cp.factoryContracts[eth_chain_id];
    const lpBondingCurveAddress = (contracts as { lpBondingCurve: string })
      .lpBondingCurve;

    if (!lpBondingCurveAddress) {
      throw new Error('Token bondingCurveAddress not found');
    }

    const onChainTokenData = await getLaunchpadToken({
      rpc: url,
      tokenAddress: token_address,
      lpBondingCurveAddress,
    });

    mustExist('env LAUNCHPAD_PRIVATE_KEY', !!config.WEB3.LAUNCHPAD_PRIVATE_KEY);

    if (!onChainTokenData.funded) {
      await transferLaunchpadLiquidityToUniswap({
        rpc: url,
        tokenAddress: token_address,
        lpBondingCurveAddress,
        privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY!,
      });

      await provider.triggerWorkflow({
        key: WorkflowKeys.CapReached,
        users: tokenHolders.map((u) => ({ id: String(u.user_id) })),
        data: {
          symbol: tokenHolders[0].symbol,
        },
      });

      token.liquidity_transferred = true;
      log.debug(`Liquidity transferred to ${token_address}`);
    }

    await token.save();
  }
}
