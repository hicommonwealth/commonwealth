import {
  logger,
  notificationsProvider,
  WorkflowKeys,
} from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getBlock,
  getLaunchpadToken,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { getCommunityAlertsSubscribedUsers } from '@hicommonwealth/model';
import { chainEvents, events } from '@hicommonwealth/schemas';
import { BigNumber } from 'ethers';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { chainNodeMustExist } from '../utils/utils';

const log = logger(import.meta);

export async function handleLaunchpadTrade(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: traderAddress,
    1: tokenAddress,
    2: isBuy,
    3: communityTokenAmount,
    4: ethAmount,
    // 5: protocolEthAmount,
    6: floatingSupply,
  } = event.parsedArgs as z.infer<typeof chainEvents.LaunchpadTrade>;

  const token = await models.LaunchpadToken.findOne({
    where: {
      token_address: tokenAddress.toLowerCase(),
    },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  const chainNode = await chainNodeMustExist(event.eventSource.ethChainId);

  const { block } = await getBlock({
    rpc: chainNode.private_url! || chainNode.url!,
    blockHash: event.rawLog.blockHash,
  });

  await models.LaunchpadTrade.findOrCreate({
    where: {
      eth_chain_id: chainNode.eth_chain_id!,
      transaction_hash: event.rawLog.transactionHash,
    },
    defaults: {
      eth_chain_id: chainNode.eth_chain_id!,
      transaction_hash: event.rawLog.transactionHash,
      token_address: tokenAddress.toLowerCase(),
      trader_address: traderAddress,
      is_buy: isBuy,
      community_token_amount: BigNumber.from(communityTokenAmount).toBigInt(),
      price:
        Number(
          (BigNumber.from(ethAmount).toBigInt() * BigInt(1e18)) /
            BigNumber.from(communityTokenAmount).toBigInt(),
        ) / 1e18,
      floating_supply: BigNumber.from(floatingSupply).toBigInt(),
      timestamp: Number(block.timestamp),
    },
  });

  const contracts =
    cp.factoryContracts[chainNode!.eth_chain_id as cp.ValidChains];
  let lpBondingCurveAddress: string;
  if (contracts && 'lpBondingCurve' in contracts) {
    lpBondingCurveAddress = contracts.lpBondingCurve;
  } else {
    log.error('No lpBondingCurve address found for chain', undefined, {
      eth_chain_id: chainNode.eth_chain_id,
    });
    return;
  }

  if (
    !token.liquidity_transferred &&
    BigNumber.from(floatingSupply).toBigInt() ===
      BigInt(token.launchpad_liquidity)
  ) {
    const onChainTokenData = await getLaunchpadToken({
      rpc: chainNode.private_url!,
      tokenAddress,
      lpBondingCurveAddress,
    });

    if (!onChainTokenData.funded) {
      await transferLaunchpadLiquidityToUniswap({
        rpc: chainNode.private_url!,
        tokenAddress,
        lpBondingCurveAddress,
        privateKey: config.WEB3.PRIVATE_KEY,
      });
    }

    token.liquidity_transferred = true;
    await token.save();
  }

  const community = await models.sequelize.query<{
    id: string;
    symbol: string;
    launchpad_liquidity: string;
  }>(
    `
            SELECT c.id, lt.symbol, lt.launchpad_liquidity
            FROM "Communities" as c
                     JOIN "LaunchpadTokens" as lt ON c.namespace = lt.namespace
            WHERE c.namespace = :token_address
        `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { token_address: tokenAddress.toLowerCase() },
    },
  );

  let users;
  if (community) {
    users = await getCommunityAlertsSubscribedUsers(community[0].id, models);
  }

  if (users) {
    const provider = notificationsProvider();

    await provider.triggerWorkflow({
      key: WorkflowKeys.LaunchpadTradeEvent,
      users: users.map((u) => ({ id: String(u.user_id) })),
      data: {
        community_id: community[0].id,
        symbol: community[0].symbol,
        is_buy: isBuy,
      },
    });

    if (
      BigNumber.from(floatingSupply.hex).toBigInt() -
        BigInt(community[0].launchpad_liquidity) <
      1000
    ) {
      await provider.triggerWorkflow({
        key: WorkflowKeys.LaunchpadCapReached,
        users: users.map((u) => ({ id: String(u.user_id) })),
        data: {
          symbol: community[0].symbol,
        },
      });
    }
  }
}
