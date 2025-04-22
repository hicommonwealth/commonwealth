import { TokenView } from '@hicommonwealth/schemas';
import BigNumber from 'bignumber.js';
import { formatAddressShort } from 'client/scripts/helpers';
import { calculateTokenPricing } from 'client/scripts/helpers/launchpad';
import { useFetchTokenUsdRateQuery } from 'client/scripts/state/api/communityStake';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import numeral from 'numeral';
import React from 'react';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { z } from 'zod';
import FormattedDisplayNumber from '../../../components/FormattedDisplayNumber/FormattedDisplayNumber';
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

  const formattedMarketCap =
    communityToken &&
    tokenPricing &&
    typeof tokenPricing.marketCapCurrent === 'number'
      ? `${currencyNameToSymbolMap[SupportedCurrencies.USD]}${numeral(tokenPricing.marketCapCurrent).format('0.00a')}`
      : 'N/A';

  // Set Total Supply to 1B for community tokens, null otherwise
  const totalSupply = !isPinnedToken ? '1000000000' : null;
  const formattedTotalSupply = totalSupply
    ? numeral(totalSupply).format('0.0a')
    : 'N/A';

  // Re-added Sanity Check Log
  if (
    tokenPricing &&
    totalSupply &&
    typeof tokenPricing.currentPrice === 'number'
  ) {
    const calculatedMarketCap = new BigNumber(tokenPricing.currentPrice).times(
      new BigNumber(totalSupply),
    );
    console.log('>>> TokenDetails Sanity Check:');
    console.log('   Price:', tokenPricing.currentPrice);
    console.log('   Supply:', totalSupply);
    console.log('   Calculated MCAP:', calculatedMarketCap.toString());
    console.log('   Reported MCAP:', tokenPricing.marketCapCurrent);
  }

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
          <CWText type="b1" fontWeight="medium">
            {formattedMarketCap}
          </CWText>
        </div>
        <div className="stat-item">
          <CWText type="b1" className="faded">
            Price
          </CWText>
          {/* Use FormattedDisplayNumber for price */}
          {communityToken &&
          tokenPricing &&
          typeof tokenPricing.currentPrice === 'number' ? (
            <FormattedDisplayNumber
              value={tokenPricing.currentPrice}
              options={{
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 4,
              }}
              type="b1"
              fontWeight="medium"
            />
          ) : (
            <CWText type="b1" fontWeight="medium">
              N/A
            </CWText>
          )}
        </div>
        {/* Conditionally render Total Supply Stat Item only for Launchpad Tokens */}
        {!isPinnedToken && (
          <div className="stat-item">
            <CWText type="b1" className="faded">
              Total Supply
            </CWText>
            <CWText type="b1" fontWeight="medium">
              {formattedTotalSupply}
            </CWText>
          </div>
        )}
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
