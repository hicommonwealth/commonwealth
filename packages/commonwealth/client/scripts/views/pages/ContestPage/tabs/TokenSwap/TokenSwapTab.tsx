import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';

import CommonTrade from '../../../CommunityHome/TokenPerformance/CommonTrade/CommonTrade';
import UniswapTrade from '../../../CommunityHome/TokenPerformance/UniswapTrade/UniswapTrade';
import useTokenData from '../../hooks/useTokenData';
import './TokenSwapTab.scss';

const TokenSwapTab = () => {
  const { isPinnedToken, tokenLaunchModalConfig, isLoadingToken } =
    useTokenData();

  if (isLoadingToken) return;

  return (
    <div className="TokenSwapTab">
      <CWText type="h3" fontWeight="semiBold">
        Token Swap
      </CWText>
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

export default TokenSwapTab;
