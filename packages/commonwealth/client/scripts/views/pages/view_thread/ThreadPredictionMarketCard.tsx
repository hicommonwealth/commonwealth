import { getCollateralBalanceAndSymbol } from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import type Thread from 'client/scripts/models/Thread';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import useUserStore from 'client/scripts/state/ui/user';
import React, { useEffect, useState } from 'react';
import { CWText } from '../../components/component_kit/cw_text';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { DeployDraftPredictionMarketModal } from '../../modals/PredictionMarket/DeployDraftPredictionMarketModal';
import { PredictionMarketResolveModal } from '../../modals/PredictionMarket/PredictionMarketResolveModal';
import { PredictionMarketTradeModal } from '../../modals/PredictionMarketTradeModal';
import './poll_cards.scss';

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
  duration?: number;
  resolution_threshold?: number;
  collateral_address?: string;
  proposal_id?: string | null;
  governor_address?: string | null;
  end_time?: Date | string | null;
  vault_address?: string | null;
  router_address?: string | null;
  market_id?: string | null;
  p_token_address?: string | null;
  f_token_address?: string | null;
  eth_chain_id?: number;
  winner?: number | null;
  created_at?: string;
  /** Total collateral minted in market (wei string from DB). */
  total_collateral?: string;
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market: PredictionMarketResult;
  isAuthor?: boolean;
  canResolveMarket?: boolean;
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

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export const ThreadPredictionMarketCard = ({
  thread,
  market,
  isAuthor = false,
  canResolveMarket = false,
}: ThreadPredictionMarketCardProps) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [collateralDisplay, setCollateralDisplay] = useState<{
    symbol: string;
    balance: string;
    decimals: number;
  } | null>(null);

  const user = useUserStore();
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
    !market.collateral_address ||
    market.collateral_address.toLowerCase() === ZERO_ADDR.toLowerCase();
  const { data: ethBalance = '' } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: activeAddress,
    ethChainId,
    apiEnabled:
      !!chainRpc && !!activeAddress && ethChainId > 0 && isCollateralZero,
  });

  useEffect(() => {
    const addr = market.collateral_address;
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
  }, [chainRpc, activeAddress, market.collateral_address, ethBalance]);

  const isDraft = market.status === 'draft';
  const isActive = market.status === 'active';
  const canCompleteDraft = isDraft && isAuthor;
  const endTime = market.end_time ? new Date(market.end_time) : new Date(0);
  const canShowResolve = isActive && canResolveMarket;
  const canTrade =
    (market.status === 'active' || market.status === 'resolved') &&
    !!market.vault_address &&
    !!market.router_address;

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
            {canTrade && collateralDisplay && (
              <CWText type="caption" className="collateral-balance-row">
                Collateral: <strong>{collateralDisplay.symbol}</strong>
                {' — '}
                Your balance: {collateralDisplay.balance}{' '}
                {collateralDisplay.symbol}
              </CWText>
            )}
            {canShowResolve && (
              <CWButton
                buttonHeight="sm"
                buttonType="primary"
                label="Resolve market"
                className="resolve-market-button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsResolveModalOpen(true);
                }}
              />
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
                  label={market.status === 'resolved' ? 'Redeem' : 'Trade'}
                  className="trade-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTradeModalOpen(true);
                  }}
                />
              )}
            </div>
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
      <CWModal
        size="medium"
        content={
          <PredictionMarketResolveModal
            thread={thread}
            market={market}
            onClose={() => setIsResolveModalOpen(false)}
            onSuccess={() => setIsResolveModalOpen(false)}
          />
        }
        onClose={() => setIsResolveModalOpen(false)}
        open={isResolveModalOpen}
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
