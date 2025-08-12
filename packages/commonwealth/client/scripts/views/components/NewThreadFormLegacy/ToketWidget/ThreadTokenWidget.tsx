import { ChainBase } from '@hicommonwealth/shared';
import {
  TradingConfig,
  TradingMode,
} from 'client/scripts/views/modals/TradeTokenModel';
import CommonTrade from 'client/scripts/views/pages/CommunityHome/TokenPerformance/CommonTrade/CommonTrade';
import React, { useEffect, useState } from 'react';
import { useGetThreadToken } from 'state/api/tokens';
import { CWIcon } from '../../component_kit/cw_icons/cw_icon';
import { CWText } from '../../component_kit/cw_text';
import './ThreadTokenWidget.scss';

interface ThreadTokenWidgetProps {
  tokenizedThreadsEnabled?: boolean;
  selectedTopicId?: number;
  threadId?: number;
  communityId?: string;
  addressType?: string;
}

const ThreadTokenWidget = ({
  tokenizedThreadsEnabled = false,
  selectedTopicId,
  threadId,
  communityId,
  addressType,
}: ThreadTokenWidgetProps) => {
  console.log('tokenizedThreadsEnabled', tokenizedThreadsEnabled);
  console.log('selectedTopicId', selectedTopicId);
  console.log('threadId', threadId);

  const [threadTokenTradeConfig, setThreadTokenTradeConfig] = useState<{
    tradeConfig?: TradingConfig;
  }>({ tradeConfig: undefined });

  const { data: threadToken, isLoading } = useGetThreadToken({
    thread_id: threadId || 0,
    enabled: !!threadId,
  });

  useEffect(() => {
    if (!tokenizedThreadsEnabled) return;

    setThreadTokenTradeConfig({
      tradeConfig: {
        mode: TradingMode.Buy,
        token: {
          token_address: threadToken?.token_address || '',
          symbol: threadToken?.symbol || 'THREAD',
          name: threadToken?.name || 'Thread Token',
          community_id: communityId || '',
          icon_url: threadToken?.icon_url || null,
          namespace: threadToken?.namespace || '',
          initial_supply: threadToken?.initial_supply || 0,
          liquidity_transferred: threadToken?.liquidity_transferred || false,
          launchpad_liquidity: threadToken?.launchpad_liquidity || '0',
          eth_market_cap_target: threadToken?.eth_market_cap_target || 0,
          description: threadToken?.description || null,
          creator_address: threadToken?.creator_address || null,
          created_at:
            threadToken?.created_at &&
            typeof threadToken.created_at === 'string'
              ? new Date(threadToken.created_at)
              : undefined,
          updated_at:
            threadToken?.updated_at &&
            typeof threadToken.updated_at === 'string'
              ? new Date(threadToken.updated_at)
              : undefined,
          latest_price: threadToken?.latest_price || null,
          old_price: threadToken?.old_price || null,
        },
        addressType: (addressType as any) || ChainBase.Ethereum,
      } as TradingConfig,
    });
  }, [
    tokenizedThreadsEnabled,
    selectedTopicId,
    threadToken,
    threadId,
    communityId,
    addressType,
  ]);

  if (!tokenizedThreadsEnabled) {
    return null;
  }

  return (
    <div className="ThreadTokenWidget">
      {threadTokenTradeConfig.tradeConfig && (
        <CommonTrade
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tradeConfig={threadTokenTradeConfig.tradeConfig as any}
        />
      )}

      <div className="notice-box">
        <CWText type="h4" fontWeight="semiBold">
          <CWIcon iconName="infoEmpty" className="blue-icon" />
          Thread Tokenization
        </CWText>

        <CWText type="b1">
          {threadToken
            ? 'Trade thread tokens for this thread.'
            : 'Create and trade thread tokens. The thread will be created when you make your first purchase.'}
        </CWText>
      </div>
    </div>
  );
};

export default ThreadTokenWidget;
