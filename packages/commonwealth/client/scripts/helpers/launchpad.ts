import { TokenView } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const calculateTokenPricing = (
  token: z.infer<typeof TokenView>,
  ethToUsdRate: number,
) => {
  const currentPrice = token.latest_price || 0;
  const currentPriceRoundingExponent =
    currentPrice !== 0
      ? Math.floor(Math.log10(Math.abs(currentPrice)))
      : currentPrice;
  const price24HrAgo = token.old_price || 0;
  const pricePercentage24HourChange = parseFloat(
    (((currentPrice - price24HrAgo) / price24HrAgo) * 100 || 0).toFixed(2),
  );
  const marketCapCurrent = currentPrice * token.initial_supply;
  const marketCapGoal = token.eth_market_cap_target * ethToUsdRate;
  const isMarketCapGoalReached = false;

  return {
    currentPrice: `${currentPrice.toFixed(-currentPriceRoundingExponent || 2)}`,
    pricePercentage24HourChange,
    marketCapCurrent,
    marketCapGoal,
    isMarketCapGoalReached,
  };
};
