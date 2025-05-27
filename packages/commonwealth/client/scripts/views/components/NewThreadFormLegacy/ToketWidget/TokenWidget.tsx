import { ChainBase } from '@hicommonwealth/shared';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import CommonTrade from 'client/scripts/views/pages/CommunityHome/TokenPerformance/CommonTrade/CommonTrade';
import UniswapTrade from 'client/scripts/views/pages/CommunityHome/TokenPerformance/UniswapTrade/UniswapTrade';
import React, { useEffect, useState } from 'react';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
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

      <div className="notice-box">
        <CWText type="h4" fontWeight="semiBold">
          <CWIcon iconName="infoEmpty" className="blue-icon" />
          Payout Notice
        </CWText>

        <CWText type="b1">
          You&apos;ll automatically receive 1% of the token supply when creating
          this thread.
        </CWText>
      </div>
    </div>
  );
};

export default TokenWidget;
