import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useFetchTokensQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import TradeTokenModal from 'views/modals/TradeTokenModel';
import { TradingMode } from 'views/modals/TradeTokenModel/TradeTokenForm/types';
import { z } from 'zod';
import TokenCard from '../../../components/TokenCard';
import './TokensList.scss';

const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

const TokensList = () => {
  const navigate = useCommonNavigate();
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenWithCommunity>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const {
    data: tokensList,
    isInitialLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFetchTokensQuery({
    cursor: 1,
    limit: 8,
    with_stats: true,
    enabled: tokenizedCommunityEnabled,
  });
  const tokens = (tokensList?.pages || []).flatMap((page) => page.results);

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  const handleFetchMoreTokens = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
    }
  };

  const calculateTokenPricing = (token: z.infer<typeof TokenView>) => {
    const currentPrice = token.latest_price || 0;
    const currentPriceRoundingExponent = Math.floor(
      Math.log10(Math.abs(currentPrice)),
    );
    const price24HrAgo = token.old_price || 0;
    const pricePercentage24HourChange = parseFloat(
      (((currentPrice - price24HrAgo) / price24HrAgo) * 100 || 0).toFixed(2),
    );
    const marketCapCurrent =
      currentPrice * (Number(token.initial_supply) / 1e18);
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

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <div className="TokensList">
      <CWText type="h2">Tokens</CWText>
      {isInitialLoading || isLoadingETHToCurrencyRate ? (
        <CWCircleMultiplySpinner />
      ) : tokens.length === 0 ? (
        <div
          className={clsx('empty-placeholder', {
            'my-16': tokenizedCommunityEnabled,
          })}
        >
          <CWText type="h2">
            No tokens found
            <br />
            Launch a new token <Link to="/createTokenCommunity">here</Link>.
          </CWText>
        </div>
      ) : (
        <div className="list">
          {(tokens || []).map((token) => {
            const pricing = calculateTokenPricing(
              token as z.infer<typeof TokenView>,
            );

            return (
              <TokenCard
                key={token.name}
                name={token.name}
                symbol={token.symbol}
                price={pricing.currentPrice}
                pricePercentage24HourChange={
                  pricing.pricePercentage24HourChange
                }
                marketCap={{
                  current: pricing.marketCapCurrent,
                  goal: pricing.marketCapGoal,
                }}
                mode={pricing.isMarketCapGoalReached ? 'swap' : 'buy'}
                iconURL={token.icon_url || ''}
                onCTAClick={() => {
                  if (pricing.isMarketCapGoalReached) return;

                  setTokenLaunchModalConfig({
                    isOpen: true,
                    tradeConfig: {
                      mode: TradingMode.Buy,
                      token: token as z.infer<typeof TokenWithCommunity>,
                      addressType: ChainBase.Ethereum,
                    },
                  });
                }}
                onCardBodyClick={() =>
                  navigateToCommunity({
                    navigate,
                    path: '',
                    chain: token.community_id,
                  })
                }
              />
            );
          })}
        </div>
      )}
      {isFetchingNextPage ? (
        <div className="m-auto">
          <CWCircleMultiplySpinner />
        </div>
      ) : hasNextPage && tokens.length > 0 ? (
        <CWButton
          label="See more"
          buttonType="tertiary"
          containerClassName="ml-auto"
          onClick={handleFetchMoreTokens}
        />
      ) : (
        <></>
      )}
      {tokenLaunchModalConfig.tradeConfig && (
        <TradeTokenModal
          isOpen={tokenLaunchModalConfig.isOpen}
          tradeConfig={tokenLaunchModalConfig.tradeConfig}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
    </div>
  );
};

export default TokensList;
