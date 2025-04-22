import { TokenView } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const calculateTokenPricing = (
  token: z.infer<typeof TokenView> | undefined,
  ethToUsdRate: number,
  ethPerToken: number,
) => {
  const currentRate = ethPerToken * ethToUsdRate || 0;
  const price24HrAgo = (token?.old_price || 0) * ethToUsdRate;
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
  const marketCapCurrent = !token?.latest_price
    ? 0 // Latest price doesn't exist, it is 0
    : token?.liquidity_transferred
      ? marketCapGoal // liquidity transferred marketCap is reached
      : // Otherwise display calculated cap
        currentRate * (token?.initial_supply || 0);
  const isMarketCapGoalReached = marketCapCurrent >= marketCapGoal;

  return {
    currentPrice: parseFloat(`${currentRate.toFixed(8)}`),
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };
};
