import { ChainBase } from '@hicommonwealth/shared';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import CommonTrade from 'client/scripts/views/pages/CommunityHome/TokenPerformance/CommonTrade/CommonTrade';
import UniswapTrade from 'client/scripts/views/pages/CommunityHome/TokenPerformance/UniswapTrade/UniswapTrade';
import React, { useEffect, useState } from 'react';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import './TokenWidget.scss';

const TokenWidget = () => {
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    tradeConfig?: TradingConfig;
  }>({ tradeConfig: undefined });

  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();

  useEffect(() => {
    if (!communityToken) return;

    setTokenLaunchModalConfig({
      tradeConfig: {
        mode: isPinnedToken ? TradingMode.Swap : TradingMode.Buy,
        token: communityToken,
        addressType: ChainBase.Ethereum,
      } as TradingConfig,
    });
  }, [communityToken, isPinnedToken]);

  if (isLoadingToken || !communityToken) return;

  return (
    <div className="TokenWidget">
      {isPinnedToken
        ? tokenLaunchModalConfig.tradeConfig && (
            <UniswapTrade
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
            />
          )
        : tokenLaunchModalConfig.tradeConfig && (
            <CommonTrade
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
            />
          )}
    </div>
  );
};

export default TokenWidget;
