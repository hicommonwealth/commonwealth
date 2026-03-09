import { getThreadUrl } from '@hicommonwealth/shared';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Link } from 'react-router-dom';
import { useFlag } from 'shared/hooks/useFlag';
import { useGetActivePredictionMarketsQuery } from 'state/api/predictionMarket';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { Skeleton } from 'views/components/Skeleton';

import './ActivePredictionMarketList.scss';

interface ActivePredictionMarketListProps {
  isCommunityHomePage?: boolean;
  communityIdFilter?: string;
}

const DISPLAY_LIMIT = 10;
const WEI_PER_UNIT = 1e18;

/** Format wei string to whole number with commas (e.g. 540230 -> "540,230") */
function formatTotalMinted(weiStr: string | undefined): string {
  if (!weiStr) return '0';
  try {
    const n = Number(BigInt(weiStr) / BigInt(WEI_PER_UNIT));
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  } catch {
    return '0';
  }
}

/** Format time remaining as "12D 4H" style */
function formatTimeRemaining(endTime: moment.Moment): string {
  const now = moment();
  if (!endTime.isAfter(now)) return 'Ended';
  const days = endTime.diff(now, 'days');
  const hours = endTime.diff(now, 'hours') % 24;
  if (days > 0) return `${days}D ${hours}H`;
  return `${hours}H`;
}

const PredictionMarketCardCompact = ({
  market,
}: {
  market: {
    id: number;
    thread_id: number;
    community_id: string;
    prompt: string;
    current_probability?: number | null;
    end_time?: string | Date | null;
    status: string;
    total_collateral?: string;
  };
}) => {
  const threadUrl = getThreadUrl(
    { chain: market.community_id, id: market.thread_id },
    undefined,
    true,
  );
  const yesPrice =
    market.current_probability != null ? market.current_probability : null;
  const endTime = market.end_time ? moment(market.end_time) : null;
  const timeLeftStr =
    endTime && endTime.isValid() && endTime.isAfter(moment())
      ? formatTimeRemaining(endTime)
      : null;
  const totalMinted = formatTotalMinted(market.total_collateral);
  const navigate = useCommonNavigate();

  const handleViewThread = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(threadUrl, {}, null);
  };

  return (
    <div className="PredictionMarketCardCompact">
      <Link to={threadUrl} className="card-link">
        <div className="badges">
          <span className="badge badge-active">ACTIVE</span>
          {timeLeftStr && (
            <span className="badge badge-time">
              <CWIcon iconName="timer" iconSize="small" />
              {timeLeftStr}
            </span>
          )}
        </div>
        <CWText type="h4" fontWeight="semiBold" className="prompt">
          {market.prompt || 'Prediction market'}
        </CWText>
        {totalMinted !== '0' && (
          <div className="volume-row">
            <CWIcon iconName="chartLineUp" iconSize="small" />
            <CWText type="caption">{totalMinted} minted</CWText>
          </div>
        )}
        <div className="metrics">
          <div className="metric-box">
            <CWText type="caption" className="metric-label">
              TOTAL MINTED
            </CWText>
            <CWText type="h4" fontWeight="semiBold" className="metric-value">
              {totalMinted}
            </CWText>
          </div>
          <div className="metric-box">
            <CWText type="caption" className="metric-label">
              YES PRICE
            </CWText>
            <CWText
              type="h4"
              fontWeight="semiBold"
              className="metric-value yes-price"
            >
              {yesPrice != null ? `$${yesPrice.toFixed(2)}` : '—'}
            </CWText>
          </div>
        </div>
      </Link>
      <div className="card-cta">
        <CWButton
          buttonType="primary"
          buttonWidth="full"
          buttonHeight="sm"
          label="View Thread"
          iconRight="chatDots"
          onClick={handleViewThread}
        />
      </div>
    </div>
  );
};

const ActivePredictionMarketList = ({
  isCommunityHomePage = false,
  communityIdFilter,
}: ActivePredictionMarketListProps) => {
  const futarchyEnabled = useFlag('futarchy');
  const { data, isLoading } = useGetActivePredictionMarketsQuery({
    community_id: isCommunityHomePage ? communityIdFilter : undefined,
    limit: DISPLAY_LIMIT,
  });

  const markets = data?.results ?? [];
  const hasMarkets = markets.length > 0;

  if (!futarchyEnabled) {
    return null;
  }

  if (!isLoading && !hasMarkets) {
    return null;
  }

  return (
    <div className="ActivePredictionMarketList">
      <div className="heading-container">
        <CWText type="h2">Prediction Markets</CWText>
        <Link to="/explore?tab=prediction-markets">
          <div className="link-right">
            <CWText className="link">See all prediction markets</CWText>
            <CWIcon iconName="arrowRightPhosphor" className="blue-icon" />
          </div>
        </Link>
      </div>
      <div className="content">
        {isLoading ? (
          <>
            <Skeleton height="300px" />
            <Skeleton height="300px" />
          </>
        ) : (
          markets.map((market) => (
            <PredictionMarketCardCompact key={market.id} market={market} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActivePredictionMarketList;
