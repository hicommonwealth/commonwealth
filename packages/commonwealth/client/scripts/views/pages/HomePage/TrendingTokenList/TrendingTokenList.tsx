import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import clsx from 'clsx';
import { APIOrderDirection } from 'helpers/constants';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTokensQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, { TradingMode } from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { z } from 'zod';
import TrendingToken from '../TrendingToken/TrendingToken';
import './TrendingTokenList.scss';

const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

type TrendingTokensListProps = {
  variant?: 'trending' | 'recent' | 'marketcap' | 'graduated';
  heading?: string;
  limit?: number;
};

const TrendingTokensList = ({
  variant = 'trending',
  heading = 'Tokens',
  limit = 3,
}: TrendingTokensListProps) => {
  const user = useUserStore();
  const navigate = useCommonNavigate();
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenWithCommunity>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  // Increase limit for carousel variants to ensure smooth scrolling
  const fetchLimit = useMemo(() => {
    if (variant === 'trending' || variant === 'recent') {
      return Math.max(limit, 30); // Fetch at least 30 tokens for carousel
    }
    return limit;
  }, [variant, limit]);

  const { data: tokensList, isInitialLoading } = useFetchTokensQuery({
    cursor: 1,
    limit: fetchLimit,
    with_stats: variant !== 'recent',
    order_by: (() => {
      if (variant === 'trending') return '24_hr_pct_change';
      if (variant === 'recent') return 'created_at';
      if (variant === 'marketcap' || variant === 'graduated')
        return 'market_cap';
      return 'price';
    })(),
    order_direction: APIOrderDirection.Desc,
    is_graduated: variant === 'graduated',
  });
  const tokens = (tokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, fetchLimit);

  // Duplicate tokens for seamless infinite scroll (only for carousel variants)
  const carouselTokens = useMemo(() => {
    if ((variant === 'trending' || variant === 'recent') && tokens.length > 0) {
      // Duplicate the array 3 times for seamless loop
      return [...tokens, ...tokens, ...tokens];
    }
    return tokens;
  }, [tokens, variant]);

  const isCarousel = variant === 'trending' || variant === 'recent';

  const openAuthModalOrTriggerCallback = () => {
    if (user.isLoggedIn) {
      trigger();
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
    }
  };

  const handleCTAClick = (
    mode: TradingMode,
    token: z.infer<typeof TokenWithCommunity>,
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

  return (
    <div className="TokensList">
      <div className="heading-container">
        <CWText type="h2">{heading}</CWText>
        <Link to="/explore?tab=tokens">
          <div className="link-right">
            <CWText className="link">Tokens</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : tokens.length === 0 ? (
        <div className={clsx('empty-placeholder', 'my-16')}>
          <CWText type="h3">
            No tokens found. Launch a new token&nbsp;
            <Link to="/createTokenCommunity">here</Link>.
          </CWText>
        </div>
      ) : (
        <div
          className={clsx('list', {
            'carousel-container': isCarousel,
          })}
          onMouseEnter={() => isCarousel && setIsPaused(true)}
          onMouseLeave={() => isCarousel && setIsPaused(false)}
        >
          <div
            className={clsx('carousel-track', {
              carousel: isCarousel,
              paused: isPaused && isCarousel,
            })}
          >
            {(isCarousel ? carouselTokens : tokens).map((token, index) => {
              // Use a unique key that includes index for duplicated items
              const uniqueKey = isCarousel
                ? `${token.name}-${index}`
                : token.name;
              return (
                <TrendingToken
                  key={uniqueKey}
                  token={token as LaunchpadToken}
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
          </div>
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
