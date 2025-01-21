import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { calculateTokenPricing } from 'helpers/launchpad';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import React, { useState } from 'react';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import useUserStore from 'state/ui/user';
import { AuthModal } from 'views/modals/AuthModal';
import TradeTokenModal, {
  TradingConfig,
  TradingMode,
} from 'views/modals/TradeTokenModel';
import { ExternalToken } from 'views/modals/TradeTokenModel/UniswapTradeModal/types';
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
import { useTokenTradeWidget } from './useTokenTradeWidget';

interface TokenTradeWidgetProps {
  currency?: SupportedCurrencies;
}

export const TokenTradeWidget = ({
  currency = SupportedCurrencies.USD,
}: TokenTradeWidgetProps) => {
  const user = useUserStore();
  const currencySymbol = currencyNameToSymbolMap[currency];

  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: TradingConfig;
  }>({ isOpen: false, tradeConfig: undefined });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { register, trigger } = useDeferredConditionTriggerCallback({
    shouldRunTrigger: user.isLoggedIn,
  });

  const { data: ethToCurrencyRateData, isLoading: isLoadingETHToCurrencyRate } =
    useFetchTokenUsdRateQuery({
      tokenSymbol: 'ETH',
    });
  const ethToUsdRate = parseFloat(
    ethToCurrencyRateData?.data?.data?.amount || '0',
  );
  const tokenPricing =
    !isPinnedToken && communityToken
      ? calculateTokenPricing(
          communityToken as z.infer<typeof TokenView>,
          ethToUsdRate,
        )
      : null;

  const openAuthModalOrTriggerCallback = () => {
    if (user.isLoggedIn) {
      trigger();
    } else {
      setIsAuthModalOpen(!user.isLoggedIn);
    }
  };

  const handleCTAClick = (mode: TradingMode) => {
    if (!user.isLoggedIn) {
      setIsAuthModalOpen(true);
    }

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
                  current: tokenPricing.marketCapCurrent,
                  goal: tokenPricing.marketCapGoal,
                  isCapped: tokenPricing.isMarketCapGoalReached,
                }}
              />
            </>
          )}
          <div
            className={clsx('action-btns', {
              [`cols-${isPinnedToken ? 1 : 2}`]: true,
            })}
          >
            {!isPinnedToken ? (
              [TradingMode.Buy, TradingMode.Sell].map((mode) => (
                <CWButton
                  key={mode}
                  label={mode}
                  buttonAlt={mode === TradingMode.Buy ? 'green' : 'rorange'}
                  buttonWidth="full"
                  buttonType="secondary"
                  buttonHeight="sm"
                  onClick={() => {
                    register({
                      cb: () => {
                        handleCTAClick(mode);
                      },
                    });
                    openAuthModalOrTriggerCallback();
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
                  register({
                    cb: () => {
                      handleCTAClick(TradingMode.Swap);
                    },
                  });
                  openAuthModalOrTriggerCallback();
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
