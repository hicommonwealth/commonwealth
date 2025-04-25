import { TokenView } from '@hicommonwealth/schemas';
import BigNumber from 'bignumber.js';
import { weiToTokens } from 'helpers';
import { z } from 'zod';

export const calculateTokenPricing = (
  token: z.infer<typeof TokenView> | undefined,
  ethToUsdRate: number,
  ethPerToken: number,
) => {
  const currentRate = ethPerToken * ethToUsdRate || 0;
  const price24HrAgo =
    (token?.old_price ||
      parseInt(process.env.LAUNCHPAD_INITIAL_PRICE || '416700000') / 1e18) *
    ethToUsdRate;
  const priceChange = (currentRate - price24HrAgo) / price24HrAgo;
  const pricePercentage24HourChange = parseFloat(
    (
      (priceChange === Number.POSITIVE_INFINITY ||
      priceChange === Number.NEGATIVE_INFINITY
        ? 0
        : priceChange) * 100 || 0
    ).toFixed(2),
  );
  const marketCapGoal = (token?.eth_market_cap_target || 0) * ethToUsdRate;

  let marketCapCurrent = !token?.latest_price
    ? 0
    : token?.liquidity_transferred
      ? marketCapGoal
      : currentRate * (token?.initial_supply || 0);

  const marketCapIsMissing =
    marketCapCurrent === null ||
    marketCapCurrent === undefined ||
    marketCapCurrent === 0;
  if (marketCapIsMissing && ethToUsdRate) {
    const initialPriceEtherStr = weiToTokens(
      process.env.LAUNCHPAD_INITIAL_PRICE || '0',
      18,
    );
    const initialPriceEther = new BigNumber(initialPriceEtherStr);
    const ethPrice = new BigNumber(ethToUsdRate);
    const initialPriceUsd = initialPriceEther.multipliedBy(ethPrice);
    const defaultTotalSupply = new BigNumber(1000000000);
    marketCapCurrent = initialPriceUsd
      .multipliedBy(defaultTotalSupply)
      .toNumber();
  }

  const isMarketCapGoalReached = marketCapCurrent >= marketCapGoal;

  return {
    currentPrice: parseFloat(`${currentRate.toFixed(8)}`),
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };
};
