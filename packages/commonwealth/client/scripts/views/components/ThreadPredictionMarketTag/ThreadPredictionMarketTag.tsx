import moment from 'moment';
import React from 'react';

import { CWText } from 'views/components/component_kit/cw_text';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

import './ThreadPredictionMarketTag.scss';

function formatVolume(weiStr: string | undefined, decimals = 18): string {
  if (!weiStr) return '0';
  const wei = BigInt(weiStr);
  if (wei === 0n) return '0.00';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const frac = ((wei % divisor) * 100n) / divisor;
  return `${whole.toLocaleString()}.${frac.toString().padStart(2, '0').slice(0, 2)}`;
}

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

const ThreadPredictionMarketTag = ({ market }: ThreadPredictionMarketTagProps) => {
  const popoverProps = usePopover();
  const passPct = Math.round((market.current_probability ?? 0.5) * 100);
  const failPct = 100 - passPct;
  const isPassLeading = passPct >= 50;
  const label = isPassLeading ? `PASS ${passPct}%` : `FAIL ${failPct}%`;
  const tagType = isPassLeading ? 'passed' : 'failed';

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
            <CWText type="caption" className="probability-bar">
              PASS {passPct}% ████████░░░░░ FAIL {failPct}%
            </CWText>
            <CWText type="caption">{timeRemaining(market.end_time)}</CWText>
            <CWText type="caption">
              {formatVolume(market.total_collateral ?? '0')} USDC locked
            </CWText>
          </div>
        }
        {...popoverProps}
      />
    </div>
  );
};

export default ThreadPredictionMarketTag;
