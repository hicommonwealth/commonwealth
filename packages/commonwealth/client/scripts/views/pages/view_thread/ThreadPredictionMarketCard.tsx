import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import { getCollateralBalanceAndSymbol } from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import type Thread from 'client/scripts/models/Thread';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import { openConfirmation } from 'client/scripts/views/modals/confirmation_modal';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
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
import { PredictionMarketTradeModal } from '../../modals/PredictionMarketTradeModal';
import './poll_cards.scss';
import { formatCollateral } from './predictionMarketUtils';
import './ThreadPredictionMarketCard.scss';

function formatCollateralBalance(wei: bigint, decimals: number): string {
  if (wei === 0n) return '0.00';
  const divisor = 10n ** BigInt(decimals);
  const whole = wei / divisor;
  const frac = ((wei % divisor) * 100n) / divisor;
  return `${whole}.${frac.toString().padStart(2, '0').slice(0, 2)}`;
}

type PredictionMarketResult = {
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
  vault_address?: string | null;
  router_address?: string | null;
  market_id?: string | null;
  p_token_address?: string | null;
  f_token_address?: string | null;
  eth_chain_id?: number;
  winner?: number | null;
  created_at?: string;
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market?: PredictionMarketResult;
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

const getTimeRemaining = (market: PredictionMarketResult) => {
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

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

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
    (marketsData?.results?.[0] as PredictionMarketResult | undefined);

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
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [collateralDisplay, setCollateralDisplay] = useState<{
    symbol: string;
    balance: string;
    decimals: number;
  } | null>(null);

  const activeAddress = user.activeAccount?.address ?? '';
  const { data: community } = useGetCommunityByIdQuery({
    id: thread?.communityId ?? '',
    includeNodeInfo: true,
    enabled: !!thread?.id,
  });
  const chainRpc =
    (community as { ChainNode?: { url?: string } } | undefined)?.ChainNode
      ?.url ?? '';
  const ethChainId =
    (community as { ChainNode?: { eth_chain_id?: number } } | undefined)
      ?.ChainNode?.eth_chain_id ?? 0;

  const isCollateralZero =
    !market?.collateral_address ||
    market?.collateral_address.toLowerCase() === ZERO_ADDR.toLowerCase();
  const { data: ethBalance = '' } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: activeAddress,
    ethChainId,
    apiEnabled:
      !!chainRpc && !!activeAddress && ethChainId > 0 && isCollateralZero,
  });

  useEffect(() => {
    const addr = market?.collateral_address;
    const isZero = !addr || addr.toLowerCase() === ZERO_ADDR.toLowerCase();
    if (isZero) {
      const bal = ethBalance === '0.' ? '0' : ethBalance || '—';
      setCollateralDisplay({ symbol: 'ETH', balance: bal, decimals: 18 });
      return;
    }
    if (!chainRpc || !activeAddress) {
      setCollateralDisplay(null);
      return;
    }
    let cancelled = false;
    getCollateralBalanceAndSymbol(chainRpc, activeAddress, addr)
      .then(({ balanceWei, symbol, decimals }) => {
        if (!cancelled)
          setCollateralDisplay({
            symbol,
            balance: formatCollateralBalance(balanceWei, decimals),
            decimals,
          });
      })
      .catch(() => {
        if (!cancelled) setCollateralDisplay(null);
      });
    return () => {
      cancelled = true;
    };
  }, [chainRpc, activeAddress, market?.collateral_address, ethBalance]);

  const canCompleteDraft = isDraft && isAuthor;
  const canTrade =
    (market?.status === 'active' || market?.status === 'resolved') &&
    !!market?.vault_address &&
    !!market?.router_address;

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
            {canTrade && collateralDisplay && (
              <CWText type="caption" className="collateral-balance-row">
                Collateral: <strong>{collateralDisplay.symbol}</strong>
                {' — '}
                Your balance: {collateralDisplay.balance}{' '}
                {collateralDisplay.symbol}
              </CWText>
            )}
            {market.total_collateral != null && (
              <CWText type="caption" className="total-minted-row">
                Total minted:{' '}
                {formatCollateralBalance(
                  BigInt(market.total_collateral),
                  collateralDisplay?.decimals ?? 18,
                )}{' '}
                {collateralDisplay?.symbol ?? 'ETH'}
              </CWText>
            )}
            <div className="PredictionMarketCard-actions">
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
              {canTrade && (
                <CWButton
                  buttonHeight="sm"
                  buttonType="secondary"
                  label="Trade"
                  className="trade-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTradeModalOpen(true);
                  }}
                />
              )}
            </div>
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
      <CWModal
        size="medium"
        content={
          <PredictionMarketTradeModal
            market={market}
            threadCommunityId={thread?.communityId ?? ''}
            onClose={() => setIsTradeModalOpen(false)}
            onSuccess={() => setIsTradeModalOpen(false)}
          />
        }
        onClose={() => setIsTradeModalOpen(false)}
        open={isTradeModalOpen}
      />
    </>
  );
};
