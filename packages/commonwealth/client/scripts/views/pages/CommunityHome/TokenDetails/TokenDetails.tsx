import { formatAddressShort } from 'client/scripts/helpers';
import { useFlag } from 'client/scripts/hooks/useFlag';
import { useFetchTokensQuery } from 'client/scripts/state/api/tokens';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import React from 'react';
import './TokenDetails.scss';

interface TokenDetailsProbs {
  communityId: string;
  communityMemberCount: number;
  communityThreadCount: number;
}

const TokenDetails = ({
  communityId,
  communityMemberCount,
  communityThreadCount,
}: TokenDetailsProbs) => {
  const launchpadEnabled = useFlag('launchpad');

  const { data: tokensList } = useFetchTokensQuery({
    cursor: 1,
    limit: 8,
    with_stats: true,
    enabled: launchpadEnabled,
  });

  const tokens = (tokensList?.pages || []).flatMap((page) => page.results);
  const communityToken = tokens.find(
    (token) => token.community_id === communityId,
  );

  const calculatePriceChange = (latest: number | null, old: number | null) => {
    if (latest === null || old === null || old === 0) return 'N/A';
    return (((latest - old) / old) * 100).toFixed(2);
  };

  if (!communityToken || !communityToken.icon_url) return <></>;

  const priceChange = calculatePriceChange(
    communityToken.latest_price ?? null,
    communityToken.old_price ?? null,
  );

  const isPriceChangeValid = priceChange !== 'N/A';
  const numericPriceChange = isPriceChangeValid ? parseFloat(priceChange) : 0;

  return (
    <div className="token-details">
      <div className="token-info">
        <div className="token-header">
          <img
            src={communityToken.icon_url}
            alt={communityToken.name}
            className="token-icon"
          />
          <div>
            <CWText type="h4" fontWeight="semiBold">
              {communityToken.name}
            </CWText>
            <CWText type="b1" className="faded">
              ${communityToken.symbol}
            </CWText>
          </div>
        </div>
        <div className="token-description">
          <CWText type="h4" fontWeight="semiBold">
            About
          </CWText>
          <CWText type="b1">{communityToken.description}</CWText>
        </div>
      </div>

      <div className="token-stats">
        <div className="stat-item">
          <CWText type="b1" className="faded">
            24h Change
          </CWText>
          <span
            className={`price-change ${
              isPriceChangeValid && numericPriceChange > 0
                ? 'positive'
                : 'negative'
            }`}
          >
            {isPriceChangeValid
              ? numericPriceChange > 0
                ? `▲ ${priceChange}%`
                : `▼ ${priceChange}%`
              : 'N/A'}
          </span>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Address
          </CWText>
          <CWText>
            {formatAddressShort(communityToken.token_address)}
            <CWTooltip
              placement="top"
              content="address copied!"
              renderTrigger={(handleInteraction, isTooltipOpen) => {
                return (
                  <CWIconButton
                    iconName="copySimple"
                    onClick={(event) => {
                      saveToClipboard(communityToken.token_address).catch(
                        console.error,
                      );
                      handleInteraction(event);
                    }}
                    onMouseLeave={(e) => {
                      if (isTooltipOpen) {
                        handleInteraction(e);
                      }
                    }}
                    className="copy-icon"
                  />
                );
              }}
            />
          </CWText>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Market Cap
          </CWText>
          <CWText>{communityToken.eth_market_cap_target}</CWText>
        </div>
        <div className="token-footer">
          <CWText type="b1" className="faded">
            <CWIcon iconName="users" /> {communityMemberCount} members
          </CWText>
          <span className="dot">•</span>
          <CWText type="b1" className="faded">
            <CWIcon iconName="calenderBlank" iconSize="small" />{' '}
            {communityThreadCount} threads
          </CWText>
        </div>
      </div>
    </div>
  );
};

export default TokenDetails;
