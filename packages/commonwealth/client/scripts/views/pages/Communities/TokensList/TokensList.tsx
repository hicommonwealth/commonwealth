import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { useFlag } from 'hooks/useFlag';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTokensQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, {
  TradingConfig,
  TradingMode,
} from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { z } from 'zod';
import TokenCard from '../../../components/TokenCard';
import {
  CommunityFilters,
  CommunitySortOptions,
  communitySortOptionsLabelToKeysMap,
} from '../FiltersDrawer';
import './TokensList.scss';

const TokenWithCommunity = TokenView.extend({
  community_id: z.string(),
});

type TokensListProps = {
  filters: CommunityFilters;
  hideHeader?: boolean;
};

const TokensList = ({ filters, hideHeader }: TokensListProps) => {
  const navigate = useCommonNavigate();
  const launchpadEnabled = useFlag('launchpad');

  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: TradingConfig;
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
  const tokens = (tokensList?.pages || []).flatMap((page) => page.results);

  const handleFetchMoreTokens = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
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
      } as TradingConfig,
    });
  };

  if (!launchpadEnabled) return <></>;

  return (
    <div className="TokensList">
      {!hideHeader && <CWText type="h2">Tokens</CWText>}
      {isInitialLoading ? (
        <CWCircleMultiplySpinner />
      ) : tokens.length === 0 ? (
        <div
          className={clsx('empty-placeholder', {
            'my-16': launchpadEnabled,
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
            return (
              <TokenCard
                key={token.name}
                token={token as LaunchpadToken}
                onCTAClick={(mode) => {
                  handleCTAClick(
                    mode,
                    token as z.infer<typeof TokenWithCommunity>,
                  );
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

export default TokensList;
