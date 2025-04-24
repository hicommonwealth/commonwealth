import {
  commonProtocol as cp,
  getLaunchpadToken,
  mustBeProtocolChainId,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { config, models } from '@hicommonwealth/model';

export async function handleCapReached(
  token_address: string,
  floating_supply: bigint,
  eth_chain_id: number,
  url: string,
) {
  mustBeProtocolChainId(eth_chain_id);

  const token = await models.LaunchpadToken.findOne({
    where: { token_address },
  });
  if (!token) throw new Error('Token not found');

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

    if (!onChainTokenData.funded) {
      await transferLaunchpadLiquidityToUniswap({
        rpc: url,
        tokenAddress: token_address,
        lpBondingCurveAddress,
        privateKey: config.WEB3.PRIVATE_KEY,
      });
      token.liquidity_transferred = true;
    }

    await token.save();
  }
}
