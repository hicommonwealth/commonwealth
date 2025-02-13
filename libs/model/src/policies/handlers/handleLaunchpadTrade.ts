import { EventHandler, logger } from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  getBlock,
  getLaunchpadToken,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { ZodUndefined } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { chainNodeMustExist } from '../utils/utils';

const log = logger(import.meta);

export const handleLaunchpadTrade: EventHandler<
  'LaunchpadTrade',
  ZodUndefined
> = async ({ payload }) => {
  const {
    trader: traderAddress,
    namespace: tokenAddress,
    isBuy,
    communityTokenAmount,
    ethAmount,
    floatingSupply,
  } = payload.parsedArgs;

  const token = await models.LaunchpadToken.findOne({
    where: {
      token_address: tokenAddress.toLowerCase(),
    },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  const chainNode = await chainNodeMustExist(payload.eventSource.ethChainId);

  const { block } = await getBlock({
    rpc: chainNode.private_url! || chainNode.url!,
    blockHash: payload.rawLog.blockHash,
  });

  await models.LaunchpadTrade.findOrCreate({
    where: {
      eth_chain_id: chainNode.eth_chain_id!,
      transaction_hash: payload.rawLog.transactionHash,
    },
    defaults: {
      eth_chain_id: chainNode.eth_chain_id!,
      transaction_hash: payload.rawLog.transactionHash,
      token_address: tokenAddress.toLowerCase(),
      trader_address: traderAddress,
      is_buy: isBuy,
      community_token_amount: communityTokenAmount,
      price: Number((ethAmount * BigInt(1e18)) / communityTokenAmount) / 1e18,
      floating_supply: floatingSupply,
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
    floatingSupply === BigInt(token.launchpad_liquidity)
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
};
