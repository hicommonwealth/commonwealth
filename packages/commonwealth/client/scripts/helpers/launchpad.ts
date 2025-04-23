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

  // Check if token was created within the last 24 hours
  const isCreatedWithin24Hours = token?.created_at
    ? Date.now() - new Date(token.created_at).getTime() < 24 * 60 * 60 * 1000
    : false;

  // Calculate price change based on old_price which is now the first trade just outside the 24 hour window
  let priceChange = 0;

  if (token?.old_price) {
    // old_price is now the price of the first trade just outside the 24h window
    const price24HrAgo = token.old_price * ethToUsdRate;
    priceChange = (currentRate - price24HrAgo) / price24HrAgo;
  } else if (isCreatedWithin24Hours) {
    // For tokens created within 24h without a trade outside 24h window,
    // use the initial launch price
    const initialPrice =
      (parseInt(process.env.LAUNCHPAD_INITIAL_PRICE || '416700000') / 1e18) *
      ethToUsdRate;
    priceChange = (currentRate - initialPrice) / initialPrice;
  }
  // Otherwise price change remains 0 (if no trade outside 24h window and not created within 24h)
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
