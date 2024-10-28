import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { useFlag } from 'hooks/useFlag';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchTokensQuery } from 'state/api/tokens';
import { CWText } from 'views/components/component_kit/cw_text';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import TokenCard from '../../../components/TokenCard';
import './TokensList.scss';

const TokensList = () => {
  const navigate = useCommonNavigate();
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

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
      fetchNextPage();
    }
  };

  if (!tokenizedCommunityEnabled) return <></>;

  return (
    <div className="TokensList">
      <CWText type="h2">Tokens</CWText>
      {isInitialLoading && tokens.length === 0 ? (
        <CWCircleMultiplySpinner />
      ) : (
        <div className="list">
          {(tokens || []).map((token) => (
            <TokenCard
              key={token.name}
              name={token.name}
              symbol={token.symbol}
              price="0.75"
              pricePercentage24HourChange={1.15}
              marketCap={{
                current: 300,
                goal: 4500,
              }}
              mode="buy"
              iconURL={token.icon_url || ''}
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
      ) : hasNextPage ? (
        <CWButton
          label="See more"
          buttonType="tertiary"
          containerClassName="ml-auto"
          onClick={handleFetchMoreTokens}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default TokensList;
