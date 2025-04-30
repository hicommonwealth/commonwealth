import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import clsx from 'clsx';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import { useFlag } from 'hooks/useFlag';
import { navigateToCommunity } from 'navigation/helpers';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetchTokensQuery } from 'state/api/tokens';
import useUserStore from 'state/ui/user';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, { TradingMode } from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { z } from 'zod';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
} from '../../Communities/FiltersDrawer';
import TrendingToken from '../TrendingToken/TrendingToken';
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
  const navigate = useNavigate();
  const launchpadEnabled = useFlag('launchpad');
  const { isWindowSmallInclusive } = useBrowserWindow({});

  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenWithCommunity>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  const { data: tokensList, isInitialLoading } = useFetchTokensQuery({
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
  const tokens = (tokensList?.pages || [])
    .flatMap((page) => page.results)
    .slice(0, 3);

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
      ) : tokens.length === 0 ? (
        <div
          className={clsx('empty-placeholder', { 'my-16': launchpadEnabled })}
        >
          {isWindowSmallInclusive ? (
            <>
              <span className="type-h3">
                Ready to launch? Create your own token&nbsp;
              </span>
              <a
                href="/createTokenCommunity"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/createTokenCommunity');
                }}
                style={{ verticalAlign: 'baseline' }}
                className="type-h3 link"
              >
                here
              </a>
              <span className="type-h3">&nbsp;and see it trend.</span>
            </>
          ) : (
            <CWText type="h3">
              Ready to launch? Create your own token&nbsp;
              <a
                href="/createTokenCommunity"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/createTokenCommunity');
                }}
                style={{ verticalAlign: 'baseline' }}
                className="link"
              >
                here
              </a>
              &nbsp;and see it trend.
            </CWText>
          )}
        </div>
      ) : (
        <div className="list">
          {(tokens || []).map((token) => {
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
