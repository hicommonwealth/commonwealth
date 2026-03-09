import { getThreadUrl } from '@hicommonwealth/shared';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import { CWTag } from '../../../components/component_kit/new_designs/CWTag';
import './PredictionMarketsList.scss';

function formatCollateralVolume(wei: string, decimals = 18): string {
  const n = BigInt(wei);
  if (n === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = n / divisor;
  const frac = (n % divisor) / (divisor / 1000n);
  if (whole >= 1_000_000n) {
    const m = Number(whole) / 1_000_000;
    return `${m.toFixed(1)}M`;
  }
  if (whole >= 1000n) {
    const k = Number(whole) / 1000;
    return `${k.toFixed(1)}k`;
  }
  return whole.toString() + (frac > 0n ? `.${frac}` : '');
}

function formatTimeLeft(
  endTime: string | null | undefined,
  status: string,
): string {
  if (status === 'resolved' || status === 'cancelled') return 'Ended';
  if (!endTime) return '—';
  const end = moment(endTime);
  const now = moment();
  const d = moment.duration(end.diff(now));
  if (d.asMilliseconds() <= 0) return 'Ended';
  const days = Math.floor(d.asDays());
  const hours = d.hours();
  const mins = d.minutes();
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
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

  const timeDisplay = formatTimeLeft(market.end_time, market.status);
  const totalMinted = market.total_collateral
    ? formatCollateralVolume(market.total_collateral)
    : '—';
  const volume = market.total_collateral
    ? formatCollateralVolume(market.total_collateral)
    : '—';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getThreadUrl(
      { chain: market.community_id, id: market.thread_id },
      undefined,
      true,
    );
    navigate(url);
  };

  return (
    <div className="ExplorePredictionMarketCard">
      <CWText type="h4" className="card-title" title={market.prompt}>
        {market.prompt || 'No prompt'}
      </CWText>

      <div className="card-status-row">
        <CWTag
          label={statusLabel[market.status] ?? market.status}
          type={statusTagType(market.status)}
        />
        <span className="card-time">
          <CWIcon iconName="timer" iconSize="small" />
          <CWText type="caption">{timeDisplay}</CWText>
        </span>
      </div>

      {showVolume && (
        <div className="card-metrics">
          <div className="metric-box">
            <CWText type="caption" className="metric-label">
              Total minted
            </CWText>
            <CWText type="b1" className="metric-value">
              {totalMinted} USDC
            </CWText>
          </div>
          <div className="metric-box">
            <CWText type="caption" className="metric-label">
              Volume
            </CWText>
            <CWText type="b1" className="metric-value">
              {volume} USDC
            </CWText>
          </div>
        </div>
      )}

      <CWButton
        label="View Thread"
        buttonType="primary"
        buttonHeight="sm"
        buttonWidth="full"
        onClick={handleClick}
        className="card-view-thread-btn"
      />
    </div>
  );
};
