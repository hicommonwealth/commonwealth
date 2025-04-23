import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { formatAddressShort } from 'helpers';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { useTokenPricing } from 'hooks/useTokenPricing';
import React, { useState } from 'react';
import { saveToClipboard } from 'utils/clipboard';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import FractionalValue from 'views/components/FractionalValue';
import MarketCapProgress from 'views/components/TokenCard/MarketCapProgress';
import PricePercentageChange from 'views/components/TokenCard/PricePercentageChange';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, {
  TradingConfig,
  TradingMode,
} from 'views/modals/TradeTokenModel';
import { LaunchpadToken } from 'views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'views/modals/TradeTokenModel/UniswapTradeModal/types';
import './TokenTradeWidget.scss';
import { TokenTradeWidgetSkeleton } from './TokenTradeWidgetSkeleton';
import { useTokenTradeWidget } from './useTokenTradeWidget';

interface TokenTradeWidgetProps {
  currency?: SupportedCurrencies;
}

export const TokenTradeWidget = ({
  currency = SupportedCurrencies.USD,
}: TokenTradeWidgetProps) => {
  const currencySymbol = currencyNameToSymbolMap[currency];

  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();

  const {
    pricing: tokenPricing,
    ethToUsdRate,
    isLoading: isLoadingETHToCurrencyRate,
  } = useTokenPricing({ token: communityToken as LaunchpadToken });

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: TradingConfig;
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCTAClick = (mode: TradingMode) => {
    // Opening modal even if user is not logged in
    setTokenLaunchModalConfig({
      isOpen: true,
      tradeConfig: {
        mode,
        token: communityToken,
        addressType: ChainBase.Ethereum,
      } as TradingConfig,
    });
  };

  if (isLoadingToken || isLoadingETHToCurrencyRate) {
    return <TokenTradeWidgetSkeleton />;
  }

  if (!communityToken) return;

  const tokenAddress =
    (communityToken as LaunchpadToken)?.token_address ||
    (communityToken as ExternalToken)?.contract_address;
  const tokenIconUrl =
    (communityToken as LaunchpadToken)?.icon_url ||
    (communityToken as ExternalToken)?.logo;

  const isLaunched = (communityToken as LaunchpadToken).liquidity_transferred;

  const finalMarketCap = tokenPricing?.marketCapCurrent ?? 0;

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

        {isPinnedToken && (
          <span className="ml-auto">
            {withTooltip(
              <CWIconButton
                iconName="infoEmpty"
                iconSize="small"
                className="ml-auto cursor-pointer"
              />,
              'Swaps only supports token on base',
              true,
            )}
          </span>
        )}
      </div>

      {isWidgetExpanded && (
        <>
          <div className="token-metadata-row pad-8">
            {tokenIconUrl && <img className="token-img" src={tokenIconUrl} />}
            <CWText type="b2" className="token-address">
              {withTooltip(
                formatAddressShort(tokenAddress),
                tokenAddress,
                true,
              )}
              <CWIcon
                iconName="copyNew"
                className="cursor-pointer"
                iconSize="small"
                onClick={() => {
                  saveToClipboard(tokenAddress, true).catch(console.error);
                }}
              />
            </CWText>
          </div>
          <CWText type="h3" fontWeight="bold" className="pad-8">
            <CWText type="h3" fontWeight="bold">
              {communityToken.symbol}
            </CWText>
            <CWText type="h3" fontWeight="bold" className="ml-auto">
              {currencySymbol}
              <FractionalValue
                value={
                  (isPinnedToken
                    ? parseFloat(
                        (communityToken as ExternalToken)?.prices?.[0]?.value ||
                          '0',
                      )
                    : tokenPricing?.currentPrice) || 0
                }
                type="h3"
                fontWeight="bold"
              />
            </CWText>
          </CWText>

          {!isPinnedToken && tokenPricing && (
            <>
              <PricePercentageChange
                pricePercentage24HourChange={
                  tokenPricing.pricePercentage24HourChange
                }
                alignment="left"
                className="pad-8"
              />
              <MarketCapProgress
                marketCap={{
                  current: finalMarketCap,
                  goal: tokenPricing.marketCapGoal,
                  isCapped: tokenPricing.isMarketCapGoalReached,
                }}
              />
            </>
          )}
          <div
            className={clsx('action-btns', {
              [`cols-${isPinnedToken || isLaunched ? 1 : 2}`]: true,
            })}
          >
            {!isPinnedToken &&
            !(communityToken as LaunchpadToken).liquidity_transferred ? (
              [TradingMode.Buy, TradingMode.Sell].map((mode) => (
                <CWButton
                  key={mode}
                  label={mode}
                  buttonAlt={mode === TradingMode.Buy ? 'green' : 'rorange'}
                  buttonWidth="full"
                  buttonType="secondary"
                  buttonHeight="sm"
                  onClick={() => {
                    handleCTAClick(mode);
                  }}
                />
              ))
            ) : (
              <CWButton
                label={TradingMode.Swap}
                buttonAlt="green"
                buttonWidth="full"
                buttonType="secondary"
                buttonHeight="sm"
                onClick={() => {
                  handleCTAClick(TradingMode.Swap);
                }}
              />
            )}
          </div>
        </>
      )}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      {tokenLaunchModalConfig.tradeConfig && (
        <TradeTokenModal
          isOpen={tokenLaunchModalConfig.isOpen}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
      <CWDivider />
    </section>
  );
};
