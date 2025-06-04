import { PinnedTokenWithPrices, TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { useGetPinnedTokensByCommunityId } from 'client/scripts/state/api/communities';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import clsx from 'clsx';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import { useFlag } from 'hooks/useFlag';
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

const TrendingTokensList = () => {
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

  // fetch launchpad tokens
  const {
    data: launchpadTokensList,
    isInitialLoading: isLoadingLaunchpadTokens,
  } = useFetchTokensQuery({
    cursor: 1,
    limit: 3,
    with_stats: true,
    enabled: launchpadEnabled,
  });

  // fetch pinned tokens
  const { data: pinnedTokensList, isInitialLoading: isLoadingPinnedTokens } =
    useGetPinnedTokensByCommunityId({
      cursor: 1,
      limit: 3,
      with_chain_node: true,
      with_price: true,
      enabled: launchpadEnabled,
    });

  const launchpadTokens = (launchpadTokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, 3);

  const pinnedTokens = (pinnedTokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, 3);

  // convert pinned tokens to LaunchpadToken format for display
  const pinnedTokensAsLaunchpad: LaunchpadToken[] = useMemo(() => {
    return pinnedTokens.map(
      (token): LaunchpadToken => ({
        name: token.name,
        symbol: token.symbol,
        icon_url: token.icon_url || '',
        community_id: token.community_id,
        token_address: token.contract_address || '',
        namespace: '',
        initial_supply: 0,
        liquidity_transferred: true,
        launchpad_liquidity: '0',
        eth_market_cap_target: 0,
        creator_address: null,
        description: null,
        created_at: undefined,
        updated_at: undefined,
      }),
    );
  }, [pinnedTokens]);

  // combine launchpad and pinned tokens
  const allTokens = [...launchpadTokens, ...pinnedTokensAsLaunchpad].slice(
    0,
    5,
  );

  const isInitialLoading = isLoadingLaunchpadTokens || isLoadingPinnedTokens;

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
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : allTokens.length === 0 ? (
        <div
          className={clsx('empty-placeholder', { 'my-16': launchpadEnabled })}
        >
          <CWText type="h3">
            No tokens found. Launch a new token&nbsp;
            <Link to="/createTokenCommunity">here</Link>.
          </CWText>
        </div>
      ) : (
        <div className="list">
          {allTokens.map((token) => {
            return (
              <TrendingToken
                key={token.name}
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
