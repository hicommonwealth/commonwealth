import moment from 'moment';
import React from 'react';

import FractionalValue from 'client/scripts/views/components/FractionalValue';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import CWPopover, {
  usePopover,
} from 'client/scripts/views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import { weiToDisplayNumber } from 'client/scripts/views/pages/view_thread/predictionMarketUtils';

import './ThreadPredictionMarketTag.scss';

function timeRemaining(endTime: string | null | undefined): string {
  if (!endTime) return '—';
  const end = moment(endTime);
  if (end.isBefore(moment())) return 'Ended';
  const days = end.diff(moment(), 'days');
  if (days <= 0) return '< 1 day remaining';
  return `${days} day${days === 1 ? '' : 's'} remaining`;
}

export type ThreadPredictionMarketTagMarket = {
  prompt: string;
  status: string;
  current_probability?: number | null;
  end_time?: string | null;
  total_collateral?: string | null;
};

interface ThreadPredictionMarketTagProps {
  market: ThreadPredictionMarketTagMarket;
}

const ThreadPredictionMarketTag = ({
  market,
}: ThreadPredictionMarketTagProps) => {
  const popoverProps = usePopover();
  const passPct = Math.round((market.current_probability ?? 0.5) * 100);
  const failPct = 100 - passPct;
  const isPassLeading = passPct >= 50;
  const label = isPassLeading ? `PASS ${passPct}%` : `FAIL ${failPct}%`;
  const tagType = isPassLeading ? 'passed' : 'failed';
  const lockedDisplay = weiToDisplayNumber(market.total_collateral, 18);

  return (
    <div className="ThreadPredictionMarketTag">
      <CWTag
        label={label}
        type={tagType}
        classNames={isPassLeading ? 'pass' : 'fail'}
        onMouseEnter={(e) => e && popoverProps.handleInteraction(e)}
        onMouseLeave={(e) => e && popoverProps.handleInteraction(e)}
      />
      <CWPopover
        className="prediction-market-popover"
        title={market.prompt || 'Prediction market'}
        body={
          <div className="ThreadPredictionMarketTag-popover-body">
            <div className="ThreadPredictionMarketTag-probability-bar">
              <CWText type="caption">PASS {passPct}%</CWText>
              <progress
                className="ThreadPredictionMarketTag-progress"
                max={100}
                value={passPct}
                aria-valuenow={passPct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
              <CWText type="caption">FAIL {failPct}%</CWText>
            </div>
            <CWText type="caption">{timeRemaining(market.end_time)}</CWText>
            <div>
              <FractionalValue
                type="caption"
                value={lockedDisplay}
                currencySymbol=" USDC"
                symbolLast
              />
              <CWText type="caption">&nbsp;locked</CWText>
            </div>
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};

export default ThreadPredictionMarketTag;
