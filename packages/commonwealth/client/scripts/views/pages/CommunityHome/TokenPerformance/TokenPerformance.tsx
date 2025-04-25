import { ChainBase } from '@hicommonwealth/shared';
import GeckoTerminalChart from 'client/scripts/views/components/GeckoTerminalChart/GeckoTerminalChart';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import { useTokenPricing } from 'hooks/useTokenPricing';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CWText } from 'views/components/component_kit/cw_text';
import { useTokenTradeWidget } from 'views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import CommonTrade from './CommonTrade/CommonTrade';
import './TokenPerformance.scss';
import UniswapTrade from './UniswapTrade/UniswapTrade';

const TokenPerformance = () => {
  const mountRef = useRef(true);

  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    tradeConfig?: TradingConfig;
  }>({ tradeConfig: undefined });

  const { communityToken, isLoadingToken, isPinnedToken } =
    useTokenTradeWidget();

  const { pricing: tokenPricing, isLoading: pricingLoading } = useTokenPricing({
    token: communityToken as LaunchpadToken,
  });
  // Use useEffect with proper cleanup
  useEffect(() => {
    if (!communityToken) {
      return;
    }

    const newConfig = {
      tradeConfig: {
        mode: isPinnedToken ? TradingMode.Swap : TradingMode.Buy,
        token: communityToken,
        addressType: ChainBase.Ethereum,
      } as TradingConfig,
    };

    setTokenLaunchModalConfig(newConfig);

    return () => {};
  }, [communityToken, isPinnedToken, componentId]);

  // Memoize these values to prevent unnecessary recalculations
  const chain = useMemo(() => {
    const result = isPinnedToken ? 'base' : 'base-sepolia';
    return result;
  }, [isPinnedToken, componentId]);

  const address = useMemo(() => {
    if (!communityToken) {
      return undefined;
    }
    const result = isPinnedToken
      ? (communityToken as ExternalToken).contract_address
      : (communityToken as LaunchpadToken).token_address;
    if (!result) {
      console.warn(
        'Token address/contract_address not found on communityToken',
        communityToken,
      );
      return undefined;
    }
    return result;
  }, [communityToken, isPinnedToken, componentId]);

  // Check if it's a launchpad token and if it has reached its goal
  const isLaunchpadToken = !isPinnedToken;
  const hasReachedGoal = useMemo(() => {
    const result = isLaunchpadToken
      ? tokenPricing?.isMarketCapGoalReached
      : true;
    return result;
  }, [isLaunchpadToken, tokenPricing, componentId]);

  // Moved conditional return after all hook calls
  if (isLoadingToken || !communityToken || pricingLoading) {
    return null;
  }

  return (
    <div className="TokenPerformance">
      <div className="heading-container">
        <CWText type="h2">Token Performance</CWText>
        <Link to="/explore?tab=tokens" className="see-all-link">
          <div className="link-right">
            <CWText className="link">See top movers</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <div
        className={`performance-content ${!hasReachedGoal ? 'no-chart' : ''}`}
      >
        {hasReachedGoal && address && (
          <GeckoTerminalChart
            className="GeckoChart"
            chain={chain}
            poolAddress={address}
            info={false}
            swaps={false}
          />
        )}
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
        {/* {!hasReachedGoal && <TopHolders />} Hide top holders for now */}
      </div>
    </div>
  );
};

export default TokenPerformance;
