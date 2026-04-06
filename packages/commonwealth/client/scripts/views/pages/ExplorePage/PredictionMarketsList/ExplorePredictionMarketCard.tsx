import { getThreadUrl } from '@hicommonwealth/shared';
import { useCollateralMeta } from 'client/scripts/views/components/PredictionMarket/useCollateralMeta';
import {
  sumWeiValues,
  weiToDisplayNumber,
} from 'client/scripts/views/pages/view_thread/predictionMarketUtils';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import FractionalValue from '../../../components/FractionalValue';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import { CWTag } from '../../../components/component_kit/new_designs/CWTag';
import './PredictionMarketsList.scss';

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
  market_volume?: string;
  initial_liquidity?: string | null;
  current_probability?: number | null;
  community_id: string;
  collateral_address?: string;
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
  const collateralMeta = useCollateralMeta({
    communityId: market.community_id,
    collateralAddress: market.collateral_address,
  });

  const timeDisplay = formatTimeLeft(market.end_time, market.status);
  const totalMintedWei = sumWeiValues(
    market.total_collateral,
    market.initial_liquidity,
  );
  const totalMinted = weiToDisplayNumber(
    totalMintedWei,
    collateralMeta.decimals,
  );
  const volume = weiToDisplayNumber(
    market.market_volume ?? '0',
    collateralMeta.decimals,
  );

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
            <FractionalValue
              type="b1"
              className="metric-value"
              value={totalMinted}
              currencySymbol={` ${collateralMeta.symbol}`}
              symbolLast
            />
          </div>
          <div className="metric-box">
            <CWText type="caption" className="metric-label">
              Volume
            </CWText>
            <FractionalValue
              type="b1"
              className="metric-value"
              value={volume}
              currencySymbol={` ${collateralMeta.symbol}`}
              symbolLast
            />
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
