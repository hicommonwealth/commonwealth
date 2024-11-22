import { events, LaunchpadTrade, logger } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { commonProtocol, models } from '@hicommonwealth/model';
import { BigNumber } from 'ethers';
import Web3 from 'web3';
import { z } from 'zod';

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
  } = event.parsedArgs as z.infer<typeof LaunchpadTrade>;

  const token = await models.Token.findOne({
    where: {
      token_address: tokenAddress,
    },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      eth_chain_id: event.eventSource.ethChainId,
    },
  });

  if (!chainNode) {
    // TODO: throw custom error with no retries -> straight to deadletter
    throw new Error('Unsupported chain');
  }

  const trade = await models.LaunchpadTrade.findOne({
    where: {
      eth_chain_id: chainNode.eth_chain_id!,
      transaction_hash: event.rawLog.transactionHash,
    },
  });

  if (!trade) {
    const web3 = new Web3(chainNode.private_url! || chainNode.url!);
    const block = await web3.eth.getBlock(event.rawLog.blockHash);

    await models.LaunchpadTrade.create({
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
    });
  }

  const contracts =
    cp.factoryContracts[chainNode!.eth_chain_id as cp.ValidChains];
  let lpBondingCurveAddress: string;
  if ('lpBondingCurve' in contracts) {
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
    const onChainTokenData = await commonProtocol.launchpadHelpers.getToken({
      rpc: chainNode.private_url!,
      tokenAddress,
      lpBondingCurveAddress,
    });

    if (!onChainTokenData.funded) {
      await commonProtocol.launchpadHelpers.transferLiquidityToUniswap({
        rpc: chainNode.private_url!,
        tokenAddress,
        lpBondingCurveAddress,
      });
    }

    token.liquidity_transferred = true;
    await token.save();
  }
}
