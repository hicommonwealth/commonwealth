import { TokenView } from '@hicommonwealth/schemas';
import { calculateTokenPricing } from 'client/scripts/helpers/launchpad';
import { useFetchTokenUsdRateQuery } from 'client/scripts/state/api/communityStake';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import PricePercentageChange from 'client/scripts/views/components/TokenCard/PricePercentageChange';
import { CWIconButton } from 'client/scripts/views/components/component_kit/cw_icon_button';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWIdentificationTag } from 'client/scripts/views/components/component_kit/new_designs/CWIdentificationTag';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { useTokenTradeWidget } from 'client/scripts/views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import React from 'react';
import { formatAddressShort } from 'shared/utils';
import { z } from 'zod';
import './GovernanceTresury.scss';

const GovernanceTresury = () => {
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
    : null;

  return (
    <div className="GovernanceTreassury">
      <div className="card-header">
        <CWText fontWeight="medium" type="h5">
          Treasury
        </CWText>

        <div className="chain-info">
          {address && (
            <div className="address-details">
              <div className="address">
                <CWIcon iconName="ethereum" iconSize="small" />
                <CWIdentificationTag address={formatAddressShort(address)} />
              </div>
              <CWTooltip
                placement="top"
                content="Address copied!"
                renderTrigger={(handleInteraction, isTooltipOpen) => (
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
                )}
              />
            </div>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="price-details">
          {communityToken ? (
            <CWText fontWeight="semiBold" type="h1">
              ${ethToUsdRate}
            </CWText>
          ) : (
            <CWText fontWeight="semiBold" type="h1">
              N/A
            </CWText>
          )}
          <div>
            {communityToken ? (
              <>
                {tokenPricing && (
                  <PricePercentageChange
                    pricePercentage24HourChange={
                      tokenPricing.pricePercentage24HourChange
                    }
                    alignment="left"
                    className="pad-8"
                    show24Hour={false}
                  />
                )}
              </>
            ) : (
              <CWText>N/A</CWText>
            )}
          </div>
        </div>
      </div>

      <CWButton buttonType="primary" label="Request Funds" buttonWidth="full" />
    </div>
  );
};

export default GovernanceTresury;
