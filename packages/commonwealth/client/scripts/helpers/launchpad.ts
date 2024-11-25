import { TokenView } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const calculateTokenPricing = (
  token: z.infer<typeof TokenView>,
  ethToUsdRate: number,
) => {
  const currentPrice = (token.latest_price || 0) * ethToUsdRate;
  const price24HrAgo = (token.old_price || 0) * ethToUsdRate;
  const priceChange = (currentPrice - price24HrAgo) / price24HrAgo;
  const pricePercentage24HourChange = parseFloat(
    (
      (priceChange === Number.POSITIVE_INFINITY ||
      priceChange === Number.NEGATIVE_INFINITY
        ? 0
        : priceChange) * 100 || 0
    ).toFixed(2),
  );
  const marketCapCurrent = currentPrice * token.initial_supply;
  const marketCapGoal = token.eth_market_cap_target * ethToUsdRate;
  const isMarketCapGoalReached = false; // TODO: https://github.com/hicommonwealth/commonwealth/issues/9887

  return {
    currentPrice: parseFloat(`${currentPrice.toFixed(8)}`),
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };
};
