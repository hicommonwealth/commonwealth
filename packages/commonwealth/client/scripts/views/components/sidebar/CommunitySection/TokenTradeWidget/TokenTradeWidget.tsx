import { TokenView } from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import React, { useState } from 'react';
import TradeTokenModal from 'views/modals/TradeTokenModel';
import { TradingMode } from 'views/modals/TradeTokenModel/TradeTokenForm';
import { z } from 'zod';
import MarketCapProgress from '../../../TokenCard/MarketCapProgress';
import PricePercentageChange from '../../../TokenCard/PricePercentageChange';
import { CWDivider } from '../../../component_kit/cw_divider';
import { CWIconButton } from '../../../component_kit/cw_icon_button';
import { CWText } from '../../../component_kit/cw_text';
import { CWButton } from '../../../component_kit/new_designs/CWButton';
import './TokenTradeWidget.scss';
import { TokenTradeWidgetSkeleton } from './TokenTradeWidgetSkeleton';

interface TokenTradeWidgetProps {
  showSkeleton: boolean;
  token: z.infer<typeof TokenView>;
}

export const TokenTradeWidget = ({
  showSkeleton,
  token,
}: TokenTradeWidgetProps) => {
  const currentPrice = (token as any).latest_price || 0; // TODO: fix type
  const price24HrAgo = (token as any).old_price || 0; // TODO: fix type
  const pricePercentage24HourChange = parseFloat(
    (((currentPrice - price24HrAgo) / price24HrAgo) * 100 || 0).toFixed(2),
  );

  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    isOpen: boolean;
    tradeConfig?: {
      mode: TradingMode;
      token: z.infer<typeof TokenView>;
      addressType: ChainBase;
    };
  }>({ isOpen: false, tradeConfig: undefined });

  const handleCTAClick = (mode: TradingMode) => {
    setTokenLaunchModalConfig({
      isOpen: true,
      tradeConfig: {
        mode,
        token,
        addressType: ChainBase.Ethereum,
      },
    });
  };

  if (showSkeleton) {
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
            {token.symbol} {(token as any).latest_price || '$10.68'}
          </CWText>

          <PricePercentageChange
            pricePercentage24HourChange={pricePercentage24HourChange}
            alignment="left"
            className="pad-8"
          />
          <MarketCapProgress
            marketCap={{
              current: 300,
              goal: 1000,
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
          tradeConfig={tokenLaunchModalConfig.tradeConfig as any} // TODO: fix this type
          onModalClose={() => setTokenLaunchModalConfig({ isOpen: false })}
        />
      )}
      <CWDivider />
    </section>
  );
};
