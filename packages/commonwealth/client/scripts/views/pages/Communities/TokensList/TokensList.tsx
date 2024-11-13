import { Token } from '@hicommonwealth/schemas';
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
import TradeTokenModal from 'views/modals/TradeTokenModel';
import { TradingMode } from 'views/modals/TradeTokenModel/TradeTokenForm/types';
import { z } from 'zod';
import TokenCard from '../../../components/TokenCard';
import './TokensList.scss';

const TokenWithCommunity = Token.extend({
  community_id: z.string(),
  initial_supply: z.string(),
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
    enabled: tokenizedCommunityEnabled,
  });
  const tokens = (tokensList?.pages || []).flatMap((page) => page.results);

  const handleFetchMoreTokens = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(console.error);
    }
  };

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <div className="TokensList">
      <CWText type="h2">Tokens</CWText>
      {isInitialLoading ? (
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
          {(tokens || []).map((token) => (
            <TokenCard
              key={token.name}
              name={token.name}
              symbol={token.symbol}
              // {
              // TODO: https://github.com/hicommonwealth/commonwealth/issues/9694
              price="0.75"
              pricePercentage24HourChange={1.15}
              marketCap={{
                current: 300,
                goal: 4500,
              }}
              // }
              mode="buy"
              iconURL={token.icon_url || ''}
              onCTAClick={() =>
                setTokenLaunchModalConfig({
                  isOpen: true,
                  tradeConfig: {
                    mode: TradingMode.Buy,
                    token: token as z.infer<typeof TokenWithCommunity>,
                    addressType: ChainBase.Ethereum,
                  },
                })
              }
              onCardBodyClick={() =>
                navigateToCommunity({
                  navigate,
                  path: '',
                  chain: token.community_id,
                })
              }
            />
          ))}
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
