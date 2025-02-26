import { TokenView } from '@hicommonwealth/schemas';
import { formatAddressShort } from 'client/scripts/helpers';
import { calculateTokenPricing } from 'client/scripts/helpers/launchpad';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import { useFetchTokenUsdRateQuery } from 'client/scripts/state/api/communityStake';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { useTokenTradeWidget } from 'client/scripts/views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import React from 'react';
import { z } from 'zod';
import SocialLinks from './SocialLinks/SocialLinks';
import './TokenDetails.scss';

interface TokenDetailsProbs {
  communityMemberCount: number;
  communityThreadCount: number;
  communityDescription: string;
}

const TokenDetails = ({
  communityMemberCount,
  communityThreadCount,
  communityDescription,
}: TokenDetailsProbs) => {
  const { data: community, isLoading } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();

  const { data: ethToCurrencyRateData } = useFetchTokenUsdRateQuery({
    tokenSymbol: 'ETH',
  });

  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );

  if (isLoadingToken) return;

  const tokenPricing = communityToken
    ? calculateTokenPricing(
        communityToken as z.infer<typeof TokenView>,
        ethToUsdRate,
      )
    : null;

  const address = communityToken
    ? isPinnedToken
      ? (communityToken as ExternalToken).contract_address
      : (communityToken as LaunchpadToken).token_address
    : undefined;

  const tokenIcon = communityToken
    ? isPinnedToken
      ? (communityToken as ExternalToken).logo
      : (communityToken as LaunchpadToken).icon_url
    : undefined;

  const marketCap = communityToken
    ? isPinnedToken
      ? 'N/A'
      : (communityToken as LaunchpadToken).eth_market_cap_target
    : undefined;

  return (
    <div className="token-details">
      <div className="token-info">
        {communityToken ? (
          <div className="token-header">
            <img
              src={tokenIcon!}
              alt={communityToken.name}
              className="token-icon"
            />
            <div>
              <CWText type="h4" fontWeight="semiBold">
                {communityToken.name}
              </CWText>
              <CWText type="b1" className="faded">
                {communityToken.symbol}
              </CWText>
            </div>
          </div>
        ) : (
          <></>
        )}
        <div className="token-description">
          <CWText type="h4" fontWeight="semiBold">
            About
          </CWText>
          <CWText type="b1">{communityDescription}</CWText>
        </div>
        <SocialLinks />
      </div>

      <div className="token-stats">
        <div className="stat-item">
          <CWText type="b1" className="faded">
            24h Change
          </CWText>
          <div>
            {communityToken ? (
              <>
                {' '}
                {tokenPricing && (
                  <PricePercentageChange
                    pricePercentage24HourChange={
                      tokenPricing.pricePercentage24HourChange
                    }
                    alignment="left"
                    className="pad-8"
                  />
                )}
              </>
            ) : (
              <CWText>N/A</CWText>
            )}
          </div>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Address
          </CWText>
          <CWText>
            {communityToken && address ? (
              <>
                {formatAddressShort(address)}
                <CWTooltip
                  placement="top"
                  content="address copied!"
                  renderTrigger={(handleInteraction, isTooltipOpen) => {
                    return (
                      <CWIconButton
                        iconName="copySimple"
                        onClick={(event) => {
                          saveToClipboard(address).catch(console.error);
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
              </>
            ) : (
              <CWText>N/A</CWText>
            )}
          </CWText>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Market Cap
          </CWText>
          {communityToken ? <CWText>{marketCap}</CWText> : <CWText>N/A</CWText>}
        </div>
        <div className="token-footer">
          <CWText type="b1" className="faded">
            <CWIcon iconName="users" iconSize="small" className="footer-icon" />{' '}
            {communityMemberCount} members
          </CWText>
          <span className="dot">•</span>
          <CWText type="b1" className="faded">
            <CWIcon
              iconName="calenderBlank"
              iconSize="small"
              className="footer-icon"
            />{' '}
            {communityThreadCount} threads
          </CWText>
        </div>
      </div>
    </div>
  );
};

export default TokenDetails;
