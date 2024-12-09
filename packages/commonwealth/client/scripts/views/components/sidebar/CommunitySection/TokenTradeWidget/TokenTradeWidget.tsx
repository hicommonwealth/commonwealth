import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { calculateTokenPricing } from 'helpers/launchpad';
import React, { useState } from 'react';
import app from 'state';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import TradeTokenModal, {
  TokenWithCommunity,
  TradingMode,
} from 'views/modals/TradeTokenModel';
import { z } from 'zod';
import { CWDivider } from '../../../component_kit/cw_divider';
import { CWIconButton } from '../../../component_kit/cw_icon_button';
import { CWText } from '../../../component_kit/cw_text';
import { CWButton } from '../../../component_kit/new_designs/CWButton';
import FractionalValue from '../../../FractionalValue';
import MarketCapProgress from '../../../TokenCard/MarketCapProgress';
import PricePercentageChange from '../../../TokenCard/PricePercentageChange';
import './TokenTradeWidget.scss';
import { TokenTradeWidgetSkeleton } from './TokenTradeWidgetSkeleton';

interface TokenTradeWidgetProps {
  showSkeleton: boolean;
  token: z.infer<typeof TokenView>;
  currency?: SupportedCurrencies;
}

export const TokenTradeWidget = ({
  showSkeleton,
  token,
  currency = SupportedCurrencies.USD,
}: TokenTradeWidgetProps) => {
  const currencySymbol = currencyNameToSymbolMap[currency];

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenWithCommunity>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );
  const tokenPricing = calculateTokenPricing(token, ethToUsdRate);

  const handleCTAClick = (mode: TradingMode) => {
    setTokenLaunchModalConfig({
      isOpen: true,
      tradeConfig: {
        mode,
        token: { ...token, community_id: app.activeChainId() || '' },
        addressType: ChainBase.Ethereum,
      },
    });
  };

  if (showSkeleton || isLoadingETHToCurrencyRate) {
    return <TokenTradeWidgetSkeleton />;
  }

  return (
    <section className="TokenTradeWidget">
      <div className="pad-8 header">
        <CWIconButton
          iconName={isWidgetExpanded ? 'caretUp' : 'caretDown'}
          weight="fill"
          onClick={() => setIsWidgetExpanded((e) => !e)}
        />
        <CWText type="b2" fontWeight="semiBold">
          Token
        </CWText>
      </div>

      {isWidgetExpanded && (
        <>
          <CWText type="h3" fontWeight="bold" className="pad-8">
            <CWText type="h3" fontWeight="bold">
              {token.symbol}
            </CWText>
            <CWText type="h3" fontWeight="bold" className="ml-auto">
              {currencySymbol}
              <FractionalValue
                value={tokenPricing.currentPrice}
                type="h3"
                fontWeight="bold"
              />
            </CWText>
          </CWText>

          <PricePercentageChange
            pricePercentage24HourChange={
              tokenPricing.pricePercentage24HourChange
            }
            alignment="left"
            className="pad-8"
          />
          <MarketCapProgress
            marketCap={{
              current: tokenPricing.marketCapCurrent,
              goal: tokenPricing.marketCapGoal,
            }}
          />
          <div className="action-btns">
            {[TradingMode.Buy, TradingMode.Sell].map((mode) => (
              <CWButton
                key={mode}
                label={mode}
                buttonAlt={mode === TradingMode.Buy ? 'green' : 'rorange'}
                buttonWidth="full"
                buttonType="secondary"
                buttonHeight="sm"
                onClick={() => handleCTAClick(mode)}
              />
            ))}
          </div>
        </>
      )}
      {tokenLaunchModalConfig.tradeConfig && (
        <TradeTokenModal
          isOpen={tokenLaunchModalConfig.isOpen}
          tradeConfig={tokenLaunchModalConfig.tradeConfig}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
      <CWDivider />
    </section>
  );
};
