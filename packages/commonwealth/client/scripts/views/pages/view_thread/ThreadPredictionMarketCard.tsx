import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import type Thread from 'models/Thread';
import moment from 'moment';
import React from 'react';
import {
  useCancelPredictionMarketMutation,
  useGetPredictionMarketsQuery,
} from 'state/api/prediction-markets';
import useUserStore from 'state/ui/user';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { formatCollateral } from './predictionMarketUtils';
import './ThreadPredictionMarketCard.scss';

type ThreadPredictionMarketCardProps = {
  thread: Thread;
};

export const ThreadPredictionMarketCard = ({
  thread,
}: ThreadPredictionMarketCardProps) => {
  const user = useUserStore();

  const { data: marketsData, isLoading } = useGetPredictionMarketsQuery({
    threadId: thread.id!,
  });

  const { mutateAsync: cancelMarket } = useCancelPredictionMarketMutation({
    threadId: thread.id!,
  });

  const market = marketsData?.results?.[0];

  const handleCancelMarket = () => {
    if (!market) return;

    openConfirmation({
      title: 'Cancel Prediction Market',
      description: 'Are you sure you want to cancel this prediction market?',
      buttons: [
        {
          label: 'Cancel Market',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await cancelMarket({
                thread_id: thread.id!,
                prediction_market_id: market.id,
              });
            } catch (err) {
              console.error('Failed to cancel prediction market', err);
            }
          },
        },
        {
          label: 'Dismiss',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  const getStatusLabel = (status: PredictionMarketStatus) => {
    switch (status) {
      case PredictionMarketStatus.Draft:
        return 'Draft';
      case PredictionMarketStatus.Active:
        return 'Active';
      case PredictionMarketStatus.Resolved:
        return 'Resolved';
      case PredictionMarketStatus.Cancelled:
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTimeRemaining = () => {
    if (!market?.end_time) return 'No end date';

    const endTime = moment(market.end_time);
    const now = moment();

    if (endTime.isBefore(now)) {
      return `Ended ${endTime.format('lll')}`;
    }

    const duration = moment.duration(endTime.diff(now));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();

    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h left`;
    } else {
      return `${duration.minutes()}m left`;
    }
  };

  const isThreadAuthor =
    user.activeAccount?.address === thread.author &&
    user.activeAccount?.community?.id === thread.communityId;

  const canCancel =
    isThreadAuthor &&
    market &&
    (market.status === PredictionMarketStatus.Draft ||
      market.status === PredictionMarketStatus.Active);

  if (isLoading) {
    return (
      <CWCard className="ThreadPredictionMarketCard skeleton">
        <div className="prediction-market-header">
          <div className="skeleton-badge" />
          <div className="skeleton-prompt" />
        </div>
        <div className="probability-section">
          <div className="skeleton-bar" />
        </div>
        <div className="market-info-section">
          <div className="skeleton-text" />
          <div className="skeleton-text" />
        </div>
      </CWCard>
    );
  }

  if (!market) {
    return (
      <CWCard className="ThreadPredictionMarketCard empty-state">
        <CWText type="b2" className="empty-state-message">
          No prediction market for this thread.
        </CWText>
      </CWCard>
    );
  }

  const passProbability = market.current_probability ?? 0.5;
  const failProbability = 1 - passProbability;

  return (
    <CWCard className="ThreadPredictionMarketCard">
      <div className="prediction-market-header">
        <div className="header-content">
          <CWText type="b2" className="market-prompt">
            {market.prompt}
          </CWText>
          <CWTag
            label={getStatusLabel(market.status)}
            type="stage"
            classNames={`status-badge status-${market.status}`}
          />
        </div>
        {canCancel && (
          <CWButton
            buttonType="tertiary"
            buttonHeight="sm"
            label="Cancel"
            onClick={handleCancelMarket}
            className="cancel-button"
          />
        )}
      </div>

      <div className="probability-section">
        <div className="probability-labels">
          <CWText type="caption" className="pass-label">
            PASS {(passProbability * 100).toFixed(1)}%
          </CWText>
          <CWText type="caption" className="fail-label">
            FAIL {(failProbability * 100).toFixed(1)}%
          </CWText>
        </div>
        <div className="probability-bar">
          <div
            className="probability-pass"
            style={{ width: `${passProbability * 100}%` }}
          />
          <div
            className="probability-fail"
            style={{ width: `${failProbability * 100}%` }}
          />
        </div>
      </div>

      <div className="market-info-section">
        <div className="info-item">
          <CWText type="caption" className="info-label">
            Total Collateral
          </CWText>
          <CWText type="b2" className="info-value">
            {formatCollateral(market.total_collateral)}
          </CWText>
        </div>
        <div className="info-item">
          <CWText type="caption" className="info-label">
            Time Remaining
          </CWText>
          <CWText type="b2" className="info-value">
            {getTimeRemaining()}
          </CWText>
        </div>
      </div>
    </CWCard>
  );
};
