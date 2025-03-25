import { PinnedTokenWithPrices, TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { useGetPinnedTokensByCommunityId } from 'client/scripts/state/api/communities';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import clsx from 'clsx';
import { calculateTokenPricing } from 'helpers/launchpad';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import { useFlag } from 'hooks/useFlag';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import { useFetchTokensQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, { TradingMode } from 'views/modals/TradeTokenModel';
import { z } from 'zod';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
} from '../../Communities/FiltersDrawer';
import TreandingToken from '../TrendingToken/TrendingToken';
import './TrendingTokenList.scss';

const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

type TokensListProps = {
  filters?: CommunityFilters;
};

const TrendingTokensList = ({
  filters = { withCommunitySortBy: CommunitySortOptions.MarketCap },
}: TokensListProps) => {
  const user = useUserStore();
  const navigate = useCommonNavigate();
  const launchpadEnabled = useFlag('launchpad');

  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token:
        | z.infer<typeof TokenWithCommunity>
        | z.infer<typeof PinnedTokenWithPrices>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  const {
    data: launchpadTokensList,
    isInitialLoading: isLoadingLaunchpadTokens,
  } = useFetchTokensQuery({
    cursor: 1,
    limit: 3,
    with_stats: true,
    order_by: (() => {
      if (
        filters.withCommunitySortBy &&
        [CommunitySortOptions.MarketCap, CommunitySortOptions.Price].includes(
          filters.withCommunitySortBy,
        )
      ) {
        return communitySortOptionsLabelToKeysMap[
          filters.withCommunitySortBy
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any;
      }

      return undefined;
    })(),
    enabled: launchpadEnabled,
  });

  const { data: pinnedTokensList, isInitialLoading: isLoadingPinnedTokens } =
    useGetPinnedTokensByCommunityId({
      cursor: 1,
      limit: 3,
      with_chain_node: true,
      with_price: true,
      enabled: !!launchpadTokensList,
    });

  const launchpadTokens = (launchpadTokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, 3);

  const pinnedTokens = (pinnedTokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, 3);

  const tokens = [...launchpadTokens, ...pinnedTokens];

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  const openAuthModalOrTriggerCallback = () => {
    if (user.isLoggedIn) {
      trigger();
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
    }
  };

  const handleCTAClick = (
    mode: TradingMode,
    token:
      | z.infer<typeof TokenWithCommunity>
      | z.infer<typeof PinnedTokenWithPrices>,
  ) => {
    setTokenLaunchModalConfig({
      isOpen: true,
      tradeConfig: {
        mode: mode,
        token: token,
        addressType: ChainBase.Ethereum,
      },
    });
  };

  if (!launchpadEnabled) return <></>;

  return (
    <div className="TokensList">
      <div className="heading-container">
        <CWText type="h2">Tokens</CWText>
        <Link to="/explore?tab=tokens">
          <div className="link-right">
            <CWText className="link">Tokens</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      {isLoadingLaunchpadTokens ||
      isLoadingPinnedTokens ||
      isLoadingETHToCurrencyRate ? (
        <CWCircleMultiplySpinner />
      ) : tokens.length === 0 ? (
        <div
          className={clsx('empty-placeholder', { 'my-16': launchpadEnabled })}
        >
          <CWText type="h2">
            No tokens found Launch a new token&nbsp;
            <Link to="/createTokenCommunity">here</Link>.
          </CWText>
        </div>
      ) : (
        <div className="list">
          {launchpadTokens.map((token) => {
            const pricing = calculateTokenPricing(
              token as z.infer<typeof TokenView>,
              ethToUsdRate,
            );

            return (
              <TreandingToken
                key={token.name}
                name={token.name}
                communityId={token.community_id}
                symbol={token.symbol}
                price={pricing.currentPrice}
                pricePercentage24HourChange={
                  pricing.pricePercentage24HourChange
                }
                isPinnedToken={false}
                marketCap={{
                  current: pricing.marketCapCurrent,
                  goal: pricing.marketCapGoal,
                  isCapped: pricing.isMarketCapGoalReached,
                }}
                mode={
                  pricing.isMarketCapGoalReached
                    ? TradingMode.Swap
                    : TradingMode.Buy
                }
                iconURL={token.icon_url || ''}
                onCTAClick={(mode) => {
                  register({
                    cb: () => {
                      handleCTAClick(
                        mode,
                        token as z.infer<typeof TokenWithCommunity>,
                      );
                    },
                  });
                  openAuthModalOrTriggerCallback();
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
          {pinnedTokens.map((token) => {
            return (
              <TreandingToken
                key={token.name}
                name={token.name}
                communityId={token.community_id}
                symbol={token.symbol}
                price={0}
                pricePercentage24HourChange={0}
                isPinnedToken={true}
                marketCap={{
                  current: 0,
                  goal: 0,
                  isCapped: false,
                }}
                mode={TradingMode.Swap}
                iconURL={token.icon_url || ''}
                onCTAClick={(mode) => {
                  register({
                    cb: () => {
                      handleCTAClick(
                        mode,
                        token as z.infer<typeof PinnedTokenWithPrices>,
                      );
                    },
                  });
                  openAuthModalOrTriggerCallback();
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        showWalletsFor={ChainBase.Ethereum}
      />
      {tokenLaunchModalConfig.tradeConfig && (
        <TradeTokenModal
          isOpen={tokenLaunchModalConfig.isOpen}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
    </div>
  );
};

export default TrendingTokensList;
