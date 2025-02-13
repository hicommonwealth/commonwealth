import { ChainBase } from '@hicommonwealth/shared';
import { useTokenTradeWidget } from 'client/scripts/views/components/sidebar/CommunitySection/TokenTradeWidget/useTokenTradeWidget';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import { LaunchpadToken } from 'client/scripts/views/modals/TradeTokenModel/CommonTradeModal/types';
import { ExternalToken } from 'client/scripts/views/modals/TradeTokenModel/UniswapTradeModal/types';
import { useEffect, useState } from 'react';

const useTokenData = () => {
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

  if (!communityToken) {
    return {
      chain: undefined,
      address: undefined,
      isPinnedToken,
      tokenLaunchModalConfig,
      isLoadingToken,
    };
  }

  const chain = isPinnedToken ? 'base' : 'base-sepolia';
  const address = isPinnedToken
    ? (communityToken as ExternalToken)?.contract_address
    : (communityToken as LaunchpadToken)?.token_address;

  return {
    chain,
    address,
    isPinnedToken,
    tokenLaunchModalConfig,
    isLoadingToken,
  };
};

export default useTokenData;
