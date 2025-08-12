import React, { useState } from 'react';
import { useGetThreadToken } from 'state/api/tokens';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CommonTradeModal from 'views/modals/TradeTokenModel/CommonTradeModal';
import { TradingMode } from 'views/modals/TradeTokenModel/types';

interface ThreadTokenBuyButtonProps {
  threadId: number;
  threadTitle: string;
  communityId: string;
  addressType: string;
}

const ThreadTokenBuyButton: React.FC<ThreadTokenBuyButtonProps> = ({
  threadId,
  threadTitle,
  communityId,
  addressType,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: threadToken, isLoading } = useGetThreadToken({
    thread_id: threadId,
    enabled: !!threadId,
  });

  if (!threadToken && !isLoading) {
    return <></>;
  }

  if (isLoading) {
    return (
      <CWButton
        label="Loading..."
        buttonType="secondary"
        buttonWidth="narrow"
        disabled
      />
    );
  }

  return (
    <>
      <CWButton
        label="Buy Thread Token"
        buttonType="primary"
        buttonWidth="narrow"
        onClick={() => setIsModalOpen(true)}
      />

      <CommonTradeModal
        isOpen={isModalOpen}
        onModalClose={() => setIsModalOpen(false)}
        tradeConfig={{
          mode: TradingMode.Buy,
          token: {
            token_address: String(threadToken!.token_address || ''),
            symbol: String(threadToken!.symbol || ''),
            name: String(threadToken!.name || ''),
            community_id: communityId,
            icon_url:
              typeof threadToken!.icon_url === 'string'
                ? threadToken!.icon_url
                : null,
            namespace: String(threadToken!.namespace || ''),
            initial_supply: Number(threadToken!.initial_supply || 0),
            liquidity_transferred: Boolean(
              threadToken!.liquidity_transferred || false,
            ),
            launchpad_liquidity: String(
              threadToken!.launchpad_liquidity || '0',
            ),
            eth_market_cap_target: Number(
              threadToken!.eth_market_cap_target || 0,
            ),
            description:
              typeof threadToken!.description === 'string'
                ? threadToken!.description
                : null,
            creator_address:
              typeof threadToken!.creator_address === 'string'
                ? threadToken!.creator_address
                : null,
            created_at:
              threadToken!.created_at &&
              typeof threadToken!.created_at === 'string'
                ? new Date(threadToken!.created_at)
                : undefined,
            updated_at:
              threadToken!.updated_at &&
              typeof threadToken!.updated_at === 'string'
                ? new Date(threadToken!.updated_at)
                : undefined,
            latest_price:
              threadToken!.latest_price &&
              typeof threadToken!.latest_price === 'number'
                ? threadToken!.latest_price
                : null,
            old_price:
              threadToken!.old_price &&
              typeof threadToken!.old_price === 'number'
                ? threadToken!.old_price
                : null,
          },
          addressType: addressType as any,
        }}
        isThreadToken={true}
      />
    </>
  );
};

export default ThreadTokenBuyButton;
