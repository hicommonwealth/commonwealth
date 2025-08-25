import { GetThreadTokenTradesOutput } from '@hicommonwealth/schemas';
import React from 'react';
import { CWText } from '../../../component_kit/cw_text';
import TradeActivityTable from './TradeActivityTable/TradeActivityTable';

interface TradeActivityTabProps {
  holders: typeof GetThreadTokenTradesOutput;
}

export const TradeActivityTab = ({ holders }: TradeActivityTabProps) => {
  if (true) {
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
