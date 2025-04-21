import { TokenView } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const calculateTokenPricing = (
  token: z.infer<typeof TokenView>,
  ethToUsdRate: number,
  ethPerToken?: number,
) => {
  let currentRate = (token.latest_price || 0) * ethToUsdRate;
  if (ethPerToken && currentRate !== 0) {
    currentRate = ethPerToken * ethToUsdRate;
  }
  const price24HrAgo = (token.old_price || 0) * ethToUsdRate;
  const priceChange = (currentRate - price24HrAgo) / price24HrAgo;
  const pricePercentage24HourChange = parseFloat(
    (
      (priceChange === Number.POSITIVE_INFINITY ||
      priceChange === Number.NEGATIVE_INFINITY
        ? 0
        : priceChange) * 100 || 0
    ).toFixed(2),
  );
  const marketCapCurrent = currentRate * token.initial_supply;
  const marketCapGoal = token.eth_market_cap_target * ethToUsdRate;
  const isMarketCapGoalReached = marketCapCurrent >= marketCapGoal;

  return {
    currentPrice: parseFloat(`${currentRate.toFixed(8)}`),
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };
};
