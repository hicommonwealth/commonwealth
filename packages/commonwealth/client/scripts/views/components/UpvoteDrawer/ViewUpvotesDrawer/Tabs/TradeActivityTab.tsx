import React from 'react';
import { trpc } from 'utils/trpcClient';
import { CWText } from '../../../component_kit/cw_text';
import TradeActivityTable from './TradeActivityTable/TradeActivityTable';

interface TradeActivityTabProps {
  tokenAddress: string;
}

export const TradeActivityTab = ({ tokenAddress }: TradeActivityTabProps) => {
  const { data: trades, isLoading } =
    trpc.launchpadToken.getLaunchpadTrades.useQuery({
      token_address: tokenAddress,
    });

  if (isLoading) {
    return (
      <div className="trade-activity-tab">
        <CWText type="b1">Loading trade activity...</CWText>
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <div className="trade-activity-tab">
        <CWText type="b1">No trade activity found</CWText>
      </div>
    );
  }

  return <TradeActivityTable trades={trades} />;
};
