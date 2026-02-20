import type Thread from 'client/scripts/models/Thread';
import React, { useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { DeployDraftPredictionMarketModal } from '../../modals/PredictionMarket/DeployDraftPredictionMarketModal';
import './poll_cards.scss';

type PredictionMarketResult = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  duration?: number;
  resolution_threshold?: number;
  collateral_address?: string;
  created_at?: string;
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market: PredictionMarketResult;
  isAuthor?: boolean;
};

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

export const ThreadPredictionMarketCard = ({
  thread,
  market,
  isAuthor = false,
}: ThreadPredictionMarketCardProps) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const isDraft = market.status === 'draft';
  const canCompleteDraft = isDraft && isAuthor;

  return (
    <>
      <CWContentPageCard
        header="Prediction market"
        showCollapsedIcon
        content={
          <div className="PredictionMarketCard">
            <CWText type="b2" className="prediction-prompt">
              {market.prompt || 'No prompt'}
            </CWText>
            <CWTag
              label={statusLabel[market.status] ?? market.status}
              type={statusTagType(market.status)}
            />
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
          </div>
        }
      />
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
