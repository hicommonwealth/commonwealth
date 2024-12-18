import { ChainBase } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { currencyNameToSymbolMap, SupportedCurrencies } from 'helpers/currency';
import { calculateTokenPricing } from 'helpers/launchpad';
import useDeferredConditionTriggerCallback from 'hooks/useDeferredConditionTriggerCallback';
import React, { useState } from 'react';
import app from 'state';
import { useFetchTokenUsdRateQuery } from 'state/api/communityStake';
import useUserStore from 'state/ui/user';
import { AuthModal } from 'views/modals/AuthModal';
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
import { useTokenTradeWidget } from './useTokenTradeWidget';

interface TokenTradeWidgetProps {
  currency?: SupportedCurrencies;
}

export const TokenTradeWidget = ({
  currency = SupportedCurrencies.USD,
}: TokenTradeWidgetProps) => {
  const user = useUserStore();
  const currencySymbol = currencyNameToSymbolMap[currency];

  const { communityToken, isLoadingToken } = useTokenTradeWidget();

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenWithCommunity>;
      addressType: ChainBase;
    };
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
  const tokenPricing = communityToken
    ? calculateTokenPricing(communityToken, ethToUsdRate)
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
        token: { ...communityToken, community_id: app.activeChainId() || '' },
        addressType: ChainBase.Ethereum,
      },
    });
  };

  if (
    isLoadingToken ||
    isLoadingETHToCurrencyRate ||
    !communityToken ||
    !tokenPricing
  ) {
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
              {communityToken.symbol}
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
              isCapped: tokenPricing.isMarketCapGoalReached,
            }}
          />
          <div
            className={clsx('action-btns', {
              [`cols-${tokenPricing.isMarketCapGoalReached ? 1 : 2}`]: true,
            })}
          >
            {!tokenPricing.isMarketCapGoalReached ? (
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
          tradeConfig={tokenLaunchModalConfig.tradeConfig}
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
      <CWDivider />
    </section>
  );
};
