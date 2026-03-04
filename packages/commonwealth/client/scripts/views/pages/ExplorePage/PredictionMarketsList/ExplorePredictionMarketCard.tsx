import { getThreadUrl } from '@hicommonwealth/shared';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './PredictionMarketsList.scss';

function formatCollateralVolume(wei: string, decimals = 18): string {
  const n = BigInt(wei);
  if (n === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = n / divisor;
  const frac = (n % divisor) / (divisor / 1000n);
  if (whole >= 1000n) {
    const k = Number(whole) / 1000;
    return `${k.toFixed(1)}k`;
  }
  return whole.toString() + (frac > 0n ? `.${frac}` : '');
}

const statusTagType = (
  status: string,
): 'info' | 'active' | 'passed' | 'failed' | 'disabled' => {
  switch (status) {
    case 'draft':
      return 'info';
    case 'active':
      return 'active';
    case 'resolved':
      return 'passed';
    case 'cancelled':
      return 'disabled';
    default:
      return 'info';
  }
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

export type ExplorePredictionMarketCardMarket = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  end_time?: string | null;
  total_collateral?: string;
  current_probability?: number | null;
  community_id: string;
  [key: string]: unknown;
};

type ExplorePredictionMarketCardProps = {
  market: ExplorePredictionMarketCardMarket;
  showVolume?: boolean;
};

export const ExplorePredictionMarketCard = ({
  market,
  showVolume = false,
}: ExplorePredictionMarketCardProps) => {
  const navigate = useCommonNavigate();

  const timeLeft =
    market.end_time && market.status === 'active'
      ? moment(market.end_time).fromNow(true)
      : null;
  const passPct =
    market.current_probability != null
      ? `${Math.round(market.current_probability * 100)}%`
      : '—';

  const handleClick = () => {
    const url = getThreadUrl(
      { chain: market.community_id, id: market.thread_id },
      undefined,
      true,
    );
    navigate(url);
  };

  return (
    <div
      className="ExplorePredictionMarketCard"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CWText type="b2" className="prediction-prompt" title={market.prompt}>
        {market.prompt || 'No prompt'}
      </CWText>
      <div className="card-meta">
        <CWTag
          label={`PASS: ${passPct}`}
          type="info"
          classNames="pass-tag"
        />
        <CWTag
          label={statusLabel[market.status] ?? market.status}
          type={statusTagType(market.status)}
        />
      </div>
      {timeLeft && (
        <CWText type="caption" className="time-left">
          {timeLeft} left
        </CWText>
      )}
      {showVolume && market.total_collateral != null && (
        <CWText type="caption" className="volume">
          {formatCollateralVolume(market.total_collateral)} USDC
        </CWText>
      )}
    </div>
  );
};
