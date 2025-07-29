import { ChainBase } from '@hicommonwealth/shared';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import React, { useState } from 'react';
import useGetThreadToken from 'state/api/tokens/getThreadToken';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CommonTrade from '../../pages/CommunityHome/TokenPerformance/CommonTrade/CommonTrade';
import { CWText } from '../component_kit/cw_text';
import './ThreadTokenWidget.scss';

type ThreadTokenWidgetProps = {
  threadId?: number;
  communityId?: string;
};

export const ThreadTokenWidget = ({
  threadId,
  communityId,
}: ThreadTokenWidgetProps) => {
  const [tokenLaunchModalConfig, setTokenLaunchModalConfig] = useState<{
    tradeConfig?: TradingConfig;
  }>({ tradeConfig: undefined });

  const { data: getThreadToken, isLoading: isLoadingThreadToken } =
    useGetThreadToken({
      thread_id: threadId ?? -1,
      enabled: !!threadId,
    });

  // export type CommonTradingConfig = {
  //   mode: TradingMode.Buy | TradingMode.Sell;
  //   token: LaunchpadToken;
  //   addressType: ChainBase;
  // };

  const tradeConfig = {
    mode: TradingMode.Buy,
    token: {
      token_address: getThreadToken?.thread_purchase_token ?? '',
      // If thread token doesn't have thread_id, we need to initialize it
      thread_token_initialize: getThreadToken?.thread_id || true,
    },
    addressType: ChainBase.Ethereum,
  };
  return (
    <div className="TokenWidget">
      <CommonTrade tradeConfig={tradeConfig} communityId={communityId} />
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
  //
  // useEffect(() => {
  //   if (!communityToken) return;
  //
  //   setTokenLaunchModalConfig({
  //     tradeConfig: {
  //       mode: isPinnedToken ? TradingMode.Swap : TradingMode.Buy,
  //       token: communityToken,
  //       addressType: ChainBase.Ethereum,
  //     } as TradingConfig,
  //   });
  // }, [communityToken, isPinnedToken]);
  //
  // if (isLoadingToken || !communityToken) return;
  //
  // return (
  //   <div className="TokenWidget">
  //     {isPinnedToken
  //       ? tokenLaunchModalConfig.tradeConfig && (
  //       <UniswapTrade
  //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //         tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
  //       />
  //     )
  //       : tokenLaunchModalConfig.tradeConfig && (
  //       <CommonTrade
  //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //         tradeConfig={tokenLaunchModalConfig.tradeConfig as any}
  //       />
  //     )}
  //
  //     <div className="notice-box">
  //       <CWText type="h4" fontWeight="semiBold">
  //         <CWIcon iconName="infoEmpty" className="blue-icon" />
  //         Payout Notice
  //       </CWText>
  //
  //       <CWText type="b1">
  //         You&apos;ll automatically receive 1% of the token supply when creating
  //         this thread.
  //       </CWText>
  //     </div>
  //   </div>
  // );
};

export default ThreadTokenWidget;
