import { ChainBase } from '@hicommonwealth/shared';
import GeckoTerminalChart from 'client/scripts/views/components/GekoTerminalChart/GekoTerminalChart';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { useTokenTradeWidget } from 'client/scripts/views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CWText } from 'views/components/component_kit/cw_text';
import CommonTrade from './CommonTrade/CommonTrade';
import './TokenPerformance.scss';
import UniswapTrade from './UniswapTrade/UniswapTrade';

const TokenPerformance = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityToken]);

  if (isLoadingToken || !communityToken) return;

  const chain = isPinnedToken ? 'base' : 'base-sepolia';
  const address = isPinnedToken
    ? // @ts-expect-error Strict-Null Check
      communityToken.contract_address
    : // @ts-expect-error Strict-Null Check
      communityToken.token_address;

  return (
    <div className="TokenPerformance">
      <div className="heading-container">
        <CWText type="h2">Token Performance</CWText>
        <Link to="/explore">
          <div className="link-right">
            <CWText className="link">See top movers</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <div className="performance-content">
        <GeckoTerminalChart
          chain={chain}
          width="650px"
          height="500px"
          poolAddress={address}
          info={false}
          swaps={false}
        />
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
    </div>
  );
};

export default TokenPerformance;
