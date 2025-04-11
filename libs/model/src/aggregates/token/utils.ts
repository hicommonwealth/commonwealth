import {
  commonProtocol as cp,
  getLaunchpadToken,
  transferLaunchpadLiquidityToUniswap,
} from '@hicommonwealth/evm-protocols';
import { config, models } from '@hicommonwealth/model';

export async function handleCapReached(
  token_address: string,
  floating_supply: bigint,
  eth_chain_id: number,
  url: string,
) {
  const token = await models.LaunchpadToken.findOne({
    where: { token_address },
  });
  if (!token) throw new Error('Token not found');

  const remainingLiquidity =
    BigInt(token.launchpad_liquidity) - floating_supply;
  if (!token.liquidity_transferred && remainingLiquidity < BigInt(1000)) {
    const contracts = cp.factoryContracts[eth_chain_id as cp.ValidChains];
    const lpBondingCurveAddress = (contracts as { lpBondingCurve: string })
      .lpBondingCurve;

    const onChainTokenData = await getLaunchpadToken({
      rpc: url!,
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
    }

    token.liquidity_transferred = true;
    await token.save();
  }
}
