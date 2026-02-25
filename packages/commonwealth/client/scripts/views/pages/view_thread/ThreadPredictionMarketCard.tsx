import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import type Thread from 'client/scripts/models/Thread';
import { openConfirmation } from 'client/scripts/views/modals/confirmation_modal';
import moment from 'moment';
import React, { useState } from 'react';
import {
  useCancelPredictionMarketMutation,
  useGetPredictionMarketsQuery,
} from 'state/api/prediction-markets';
import useUserStore from 'state/ui/user';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { DeployDraftPredictionMarketModal } from '../../modals/PredictionMarket/DeployDraftPredictionMarketModal';
import { formatCollateral } from './predictionMarketUtils';
import './ThreadPredictionMarketCard.scss';

type PredictionMarketData = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  end_time?: string;
  total_collateral?: string;
  current_probability?: number;
  duration?: number;
  resolution_threshold?: number;
  collateral_address?: string;
  created_at?: string;
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market?: PredictionMarketData;
  isAuthor?: boolean;
};

const getStatusLabel = (status: string) => {
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

const getTimeRemaining = (market: PredictionMarketData) => {
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

export const ThreadPredictionMarketCard = ({
  thread,
  market: marketProp,
  isAuthor: isAuthorProp,
}: ThreadPredictionMarketCardProps) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const user = useUserStore();

  const { data: marketsData, isLoading } = useGetPredictionMarketsQuery({
    threadId: thread.id!,
    apiCallEnabled: !marketProp,
  });

  const { mutateAsync: cancelMarket } = useCancelPredictionMarketMutation({
    threadId: thread.id!,
  });

  const market =
    marketProp ??
    (marketsData?.results?.[0] as PredictionMarketData | undefined);

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

  const isThreadAuthor =
    user.activeAccount?.address === thread.author &&
    user.activeAccount?.community?.id === thread.communityId;

  const isAuthor = isAuthorProp ?? isThreadAuthor;

  const isDraft = market?.status === PredictionMarketStatus.Draft;
  const canCompleteDraft = isDraft && isAuthor;

  const canCancel =
    isAuthor &&
    market &&
    (market.status === PredictionMarketStatus.Draft ||
      market.status === PredictionMarketStatus.Active);

  if (marketProp === undefined && isLoading) {
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
    <>
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
          <div className="header-actions">
            {canCompleteDraft && (
              <CWButton
                buttonHeight="sm"
                buttonType="primary"
                label="Complete deployment"
                className="complete-deployment-button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDeployModalOpen(true);
                }}
              />
            )}
            {canCancel && !canCompleteDraft && (
              <CWButton
                buttonType="tertiary"
                buttonHeight="sm"
                label="Cancel"
                onClick={handleCancelMarket}
                className="cancel-button"
              />
            )}
          </div>
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
              {formatCollateral(market.total_collateral ?? '0')}
            </CWText>
          </div>
          <div className="info-item">
            <CWText type="caption" className="info-label">
              Time Remaining
            </CWText>
            <CWText type="b2" className="info-value">
              {getTimeRemaining(market)}
            </CWText>
          </div>
        </div>
      </CWCard>

      <CWModal
        size="medium"
        content={
          <DeployDraftPredictionMarketModal
            thread={thread}
            market={market}
            onClose={() => setIsDeployModalOpen(false)}
            onSuccess={() => setIsDeployModalOpen(false)}
          />
        }
        onClose={() => setIsDeployModalOpen(false)}
        open={isDeployModalOpen}
      />
    </>
  );
};
