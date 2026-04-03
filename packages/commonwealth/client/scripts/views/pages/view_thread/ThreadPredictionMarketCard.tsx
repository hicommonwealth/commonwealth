import { PredictionMarketStatus } from '@hicommonwealth/schemas';
import {
  getCollateralBalanceAndSymbol,
  getPredictionMarketBalancesFromChain,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { resolveEvmWalletAddress } from 'client/scripts/helpers/resolveEvmWalletAddress';
import type Thread from 'client/scripts/models/Thread';
import useGetCommunityByIdQuery from 'client/scripts/state/api/communities/getCommuityById';
import { useGetUserEthBalanceQuery } from 'client/scripts/state/api/communityStake';
import {
  useGetPredictionMarketPositionsQuery,
  useGetPredictionMarketTradesQuery,
} from 'client/scripts/state/api/predictionMarket';
import { openConfirmation } from 'client/scripts/views/modals/confirmation_modal';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import {
  useCancelPredictionMarketMutation,
  useGetPredictionMarketsQuery,
} from 'state/api/prediction-markets';
import useUserStore from 'state/ui/user';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWDivider } from '../../components/component_kit/cw_divider';
import { CWIconButton } from '../../components/component_kit/cw_icon_button';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { PopoverMenu } from '../../components/component_kit/CWPopoverMenu';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { DeployDraftPredictionMarketModal } from '../../modals/PredictionMarket/DeployDraftPredictionMarketModal';
import { PredictionMarketResolveModal } from '../../modals/PredictionMarket/PredictionMarketResolveModal';
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

export type PredictionMarketResult = {
  id: number;
  thread_id: number;
  prompt: string;
  status: string;
  total_collateral?: string;
  current_probability?: number;
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
  [key: string]: unknown;
};

type ThreadPredictionMarketCardProps = {
  thread: Thread;
  market?: PredictionMarketResult;
  isAuthor?: boolean;
  canResolveMarket?: boolean;
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

const getStatusTagType = (
  status: string,
): 'info' | 'active' | 'passed' | 'disabled' => {
  switch (status) {
    case PredictionMarketStatus.Draft:
      return 'info';
    case PredictionMarketStatus.Active:
      return 'active';
    case PredictionMarketStatus.Resolved:
      return 'passed';
    case PredictionMarketStatus.Cancelled:
      return 'disabled';
    default:
      return 'info';
  }
};

const getTimeRemaining = (m: PredictionMarketResult) => {
  if (!m?.end_time) return null;

  const endTime = moment(m.end_time);
  const now = moment();

  if (endTime.isBefore(now)) {
    return `Ended ${endTime.format('lll')}`;
  }

  const duration = moment.duration(endTime.diff(now));
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export const ThreadPredictionMarketCard = ({
  thread,
  market: marketProp,
  isAuthor: isAuthorProp,
  canResolveMarket,
}: ThreadPredictionMarketCardProps) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [timeDisplay, setTimeDisplay] = useState<string | null>(null);
  const [onChainPassFailBalances, setOnChainPassFailBalances] = useState<{
    p: bigint;
    f: bigint;
  } | null>(null);
  const user = useUserStore();

  const evmWalletAddress = useMemo(
    () =>
      resolveEvmWalletAddress(thread?.communityId ?? '', {
        addressSelectorSelectedAddress: user.addressSelectorSelectedAddress,
        activeAccount: user.activeAccount,
        accounts: user.accounts,
        addresses: user.addresses,
      }),
    [
      thread?.communityId,
      user.addressSelectorSelectedAddress,
      user.activeAccount,
      user.accounts,
      user.addresses,
    ],
  );

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

  const { data: positions = [] } = useGetPredictionMarketPositionsQuery({
    prediction_market_id: market?.id ?? 0,
  });
  const userPosition = Array.isArray(positions)
    ? positions.find(
        (p: { user_address: string }) =>
          evmWalletAddress &&
          p.user_address?.toLowerCase() === evmWalletAddress.toLowerCase(),
      )
    : undefined;

  const { data: tradesData } = useGetPredictionMarketTradesQuery({
    prediction_market_id: market?.id ?? 0,
  });
  const trades =
    (tradesData as { results?: { collateral_amount: string }[] })?.results ??
    [];
  const marketVolume = trades.reduce(
    (sum, t) => sum + BigInt(t.collateral_amount || '0'),
    0n,
  );

  const [collateralDisplay, setCollateralDisplay] = useState<{
    symbol: string;
    balance: string;
    decimals: number;
  } | null>(null);

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
    walletAddress: evmWalletAddress,
    ethChainId,
    apiEnabled:
      !!chainRpc && !!evmWalletAddress && ethChainId > 0 && isCollateralZero,
  });

  useEffect(() => {
    if (!market) return;
    setTimeDisplay(getTimeRemaining(market));
  }, [market]);

  useEffect(() => {
    if (!market?.end_time) return;
    const endTime = moment(market.end_time);
    if (endTime.isBefore(moment())) return;

    const interval = setInterval(() => {
      setTimeDisplay(getTimeRemaining(market));
    }, 1000);
    return () => clearInterval(interval);
  }, [market?.end_time, market]);

  // Match trade modal: if API has no position row, read PASS/FAIL balances from chain
  useEffect(() => {
    if (userPosition) {
      setOnChainPassFailBalances(null);
      return;
    }
    if (
      !chainRpc ||
      !evmWalletAddress ||
      !market?.p_token_address ||
      !market?.f_token_address
    ) {
      return;
    }
    let cancelled = false;
    getPredictionMarketBalancesFromChain(
      chainRpc,
      evmWalletAddress,
      market.p_token_address,
      market.f_token_address,
    )
      .then(({ pTokenBalanceWei, fTokenBalanceWei }) => {
        if (!cancelled)
          setOnChainPassFailBalances({
            p: pTokenBalanceWei,
            f: fTokenBalanceWei,
          });
      })
      .catch(() => {
        if (!cancelled) setOnChainPassFailBalances(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    chainRpc,
    evmWalletAddress,
    market?.p_token_address,
    market?.f_token_address,
    userPosition,
  ]);

  useEffect(() => {
    const addr = market?.collateral_address;
    const isZero = !addr || addr.toLowerCase() === ZERO_ADDR.toLowerCase();
    if (isZero) {
      const bal = ethBalance === '0.' ? '0' : ethBalance || '—';
      setCollateralDisplay({ symbol: 'ETH', balance: bal, decimals: 18 });
      return;
    }
    if (!chainRpc || !evmWalletAddress) {
      setCollateralDisplay(null);
      return;
    }
    let cancelled = false;
    getCollateralBalanceAndSymbol(chainRpc, evmWalletAddress, addr)
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
  }, [chainRpc, evmWalletAddress, market?.collateral_address, ethBalance]);

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

  const canTrade =
    (market?.status === 'active' || market?.status === 'resolved') &&
    !!market?.vault_address &&
    !!market?.router_address;

  const canCancel =
    isAuthor && market && market.status === PredictionMarketStatus.Draft;

  const canResolve =
    isAuthor &&
    market &&
    market.status === PredictionMarketStatus.Active &&
    !!market.vault_address;

  const decimals = collateralDisplay?.decimals ?? 18;
  const symbol = collateralDisplay?.symbol ?? 'ETH';
  const pWei = userPosition
    ? BigInt(
        String(
          (userPosition as { p_token_balance: string }).p_token_balance ?? '0',
        ),
      )
    : (onChainPassFailBalances?.p ?? 0n);
  const fWei = userPosition
    ? BigInt(
        String(
          (userPosition as { f_token_balance: string }).f_token_balance ?? '0',
        ),
      )
    : (onChainPassFailBalances?.f ?? 0n);
  const pBalance = formatCollateralBalance(pWei, decimals);
  const fBalance = formatCollateralBalance(fWei, decimals);

  const passProbability = market?.current_probability ?? 0.5;
  const failProbability = 1 - passProbability;

  if (marketProp === undefined && isLoading) {
    return (
      <CWCard className="ThreadPredictionMarketCard skeleton">
        <div className="prediction-market-header">
          <div className="skeleton-badge" />
          <div className="skeleton-prompt" />
        </div>
        <div className="metrics-cards">
          <div className="skeleton-metric" />
          <div className="skeleton-metric" />
        </div>
        <div className="probability-section">
          <div className="skeleton-bar" />
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

  return (
    <>
      <CWCard className="ThreadPredictionMarketCard">
        <div className="prediction-market-header">
          <div className="market-prompt-row">
            <CWText type="b2" className="market-prompt">
              {market.prompt}
            </CWText>
            {(canCancel || canResolve || canCompleteDraft) && (
              <PopoverMenu
                className="prediction-market-actions"
                placement="bottom-end"
                renderTrigger={(handleInteraction) => (
                  <CWIconButton
                    iconName="gear"
                    iconSize="small"
                    onClick={handleInteraction}
                    iconButtonTheme="neutral"
                    aria-label="Market actions"
                  />
                )}
                menuItems={[
                  ...(canCompleteDraft
                    ? [
                        {
                          label: 'Complete deployment',
                          iconLeft: 'trophy' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: (e?: React.MouseEvent<HTMLElement>) => {
                            e?.stopPropagation();
                            setIsDeployModalOpen(true);
                          },
                        },
                      ]
                    : []),
                  ...(canCancel
                    ? [
                        {
                          label: 'Cancel market',
                          iconLeft: 'close' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: (e?: React.MouseEvent<HTMLElement>) => {
                            e?.stopPropagation();
                            handleCancelMarket();
                          },
                        },
                      ]
                    : []),
                  ...(canResolve && canResolveMarket
                    ? [
                        {
                          label: 'Resolve market',
                          iconLeft: 'trophy' as const,
                          iconLeftWeight: 'bold' as const,
                          onClick: () => setIsResolveModalOpen(true),
                        },
                      ]
                    : []),
                ]}
              />
            )}
          </div>
          {timeDisplay && (
            <div className="time-remaining">
              <CWIcon iconName="timer" iconSize="small" />
              <CWText type="caption" className="time-text">
                {timeDisplay}
              </CWText>
            </div>
          )}
          <CWTag
            label={getStatusLabel(market.status)}
            type={getStatusTagType(market.status)}
            classNames="status-badge"
          />
        </div>
        <CWDivider />

        <div className="metrics-cards">
          <div className="metric-card">
            <div className="metric-row">
              <CWText type="caption" className="metric-label">
                TOTAL MINTED
              </CWText>
              <CWText type="b1" className="metric-value">
                {formatCollateral(market.total_collateral ?? '0')}&nbsp;
                <CWText type="b2">
                  <span className="metric-symbol">{symbol}</span>
                </CWText>
              </CWText>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-row">
              <CWText type="caption" className="metric-label">
                MARKET VOL.
              </CWText>
              <CWText type="b1" className="metric-value">
                {formatCollateral(marketVolume.toString())}&nbsp;
                <CWText type="b2">
                  <span className="metric-symbol">{symbol}</span>
                </CWText>
              </CWText>
            </div>
          </div>
        </div>

        <div className="collateral-section">
          <div className="collateral-row">
            <CWText type="caption" className="collateral-label">
              Collateral
            </CWText>
            <CWText type="caption" className="collateral-value">
              {symbol}
            </CWText>
          </div>
          <div className="collateral-row">
            <CWText type="caption" className="collateral-label">
              Your balance
            </CWText>
            <CWText type="b2" className="collateral-value">
              {collateralDisplay?.balance ?? '—'} {symbol}
            </CWText>
          </div>
        </div>
        <CWDivider />
        <div className="probability-section">
          <div className="probability-labels">
            <div className="balance-label">
              <CWText type="caption" className="pass-label">
                PASS BALANCE
              </CWText>
              <CWText type="b2" className="pass-value">
                {pBalance}&nbsp;
              </CWText>
            </div>
            <div className="balance-label end">
              <CWText type="caption" className="fail-label">
                FAIL BALANCE
              </CWText>
              <CWText type="b2" className="fail-value">
                {fBalance}&nbsp;
              </CWText>
            </div>
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

        <div className="action-buttons">
          {canTrade && (
            <CWButton
              buttonHeight="sm"
              buttonType="secondary"
              buttonWidth="full"
              label={market.status === 'resolved' ? 'Redeem' : 'Trade'}
              iconLeft="transfer"
              className="trade-button"
              onClick={(e) => {
                e.preventDefault();
                setIsTradeModalOpen(true);
              }}
            />
          )}
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
